import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { upload } from "@/db/schema";
import { stripBasePath } from "./base-path";
import { appUrl } from "./microsoft";

// Saved emails link their images to this app (e.g. http://localhost:3000/
// images/hero.jpg), which guests can't reach while the app runs locally.
// Before an email goes to Outlook, each of the app's own images is attached
// to the message and the <img> pointed at the attachment ("cid:..."), so the
// images travel with the email. Images hosted elsewhere (e.g. placeholder
// icons) are left as links, since they load anywhere.

export type InlineImage = { name: string; contentType: string; contentId: string; bytes: Buffer };

// Microsoft Graph rejects a message over about 4MB in one request.
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;

export class EmailTooLargeError extends Error {}

const CONTENT_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Is this URL one of the app's own images? Matches APP_URL, plus localhost
// for emails generated during local development.
function isOwnImage(url: URL): boolean {
    return url.origin === new URL(appUrl()).origin || ["localhost", "127.0.0.1"].includes(url.hostname);
}

// Images larger than this get shrunk before they're attached. Nothing in the
// email shows wider than 720px, so 1440px (double, for sharp screens) is
// plenty, and a full-size camera photo would otherwise blow the size limit.
const MAX_IMAGE_WIDTH = 1440;
const SHRINK_OVER_BYTES = 300 * 1024;

type LoadedImage = Omit<InlineImage, "contentId">;

// Shrinks and recompresses an oversized image; small ones pass through.
// PNGs with transparency (logos, icons) stay PNG; everything else becomes JPEG.
async function shrink(image: LoadedImage): Promise<LoadedImage> {
    if (image.bytes.length <= SHRINK_OVER_BYTES || image.contentType === "image/gif") return image;
    try {
        const input = sharp(image.bytes).rotate();
        const { hasAlpha } = await input.metadata();
        const resized = input.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
        const base = image.name.replace(/\.[^.]+$/, "");
        if (hasAlpha) {
            const bytes = await resized.png({ compressionLevel: 9, palette: true }).toBuffer();
            return { name: `${base}.png`, contentType: "image/png", bytes };
        }
        const bytes = await resized.flatten({ background: "#ffffff" }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        return { name: `${base}.jpg`, contentType: "image/jpeg", bytes };
    } catch {
        return image; // not readable by sharp; send as is
    }
}

async function loadImage(url: URL): Promise<LoadedImage | null> {
    const image = await readImage(url);
    return image && shrink(image);
}

async function readImage(url: URL): Promise<LoadedImage | null> {
    const pathname = stripBasePath(url.pathname);
    const uploadId = pathname.match(/^\/uploads\/([\w-]+)$/)?.[1];
    if (uploadId) {
        const [row] = await db
            .select({ contentType: upload.contentType, data: upload.data })
            .from(upload)
            .where(eq(upload.id, uploadId));
        if (!row) return null;
        const ext = row.contentType === "image/png" ? "png" : "jpg";
        return { name: `image-${uploadId.slice(0, 8)}.${ext}`, contentType: row.contentType, bytes: row.data };
    }

    // A file in public/. Resolved and checked so a crafted path can't read
    // anything outside that folder.
    const file = path.resolve(PUBLIC_DIR, "." + decodeURIComponent(pathname));
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];
    if (!file.startsWith(PUBLIC_DIR + path.sep) || !contentType) return null;
    try {
        return { name: path.basename(file), contentType, bytes: await readFile(file) };
    } catch {
        return null;
    }
}

export async function inlineImages(html: string): Promise<{ html: string; images: InlineImage[] }> {
    // The renderer writes every image as <img src="..."> with & escaped as &amp;.
    const sources = new Set([...html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)].map((m) => m[1]));

    const images: InlineImage[] = [];
    let result = html;
    for (const src of sources) {
        let url: URL;
        try {
            url = new URL(src.replaceAll("&amp;", "&"));
        } catch {
            continue;
        }
        if (!isOwnImage(url)) continue;

        const image = await loadImage(url);
        if (!image) {
            console.warn("Couldn't embed image, leaving it as a link:", src);
            continue;
        }
        const contentId = `img${images.length + 1}@quote-email`;
        images.push({ ...image, contentId });
        result = result.replaceAll(`src="${src}"`, `src="cid:${contentId}"`);
    }

    const total = images.reduce((sum, image) => sum + image.bytes.length, 0);
    if (total > MAX_TOTAL_BYTES) {
        throw new EmailTooLargeError(`Images total ${(total / 1024 / 1024).toFixed(1)}MB`);
    }
    return { html: result, images };
}
