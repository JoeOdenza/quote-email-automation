import "server-only";
import sharp from "sharp";
import { ICON_SIZE } from "./incentives";
import { EMAIL_WIDTH, HERO_HEIGHT, cardImageSize } from "./render";
import type { QuoteType } from "./tiers";

// Uploaded images are reshaped here, on the server, because email clients
// like Outlook ignore CSS cropping: each image has to arrive at exactly the
// size and shape it's shown at. Each function returns null if the file isn't
// a readable image.

// The banner is stored at twice the size it shows at in the email (720 × 200),
// so it stays sharp on high-density screens.
export const BANNER_WIDTH = EMAIL_WIDTH * 2;
export const BANNER_HEIGHT = HERO_HEIGHT * 2;

// Turns an uploaded photo into a 1440 × 400 JPEG.
export async function prepareBanner(file: File): Promise<Buffer | null> {
    try {
        return await sharp(Buffer.from(await file.arrayBuffer()))
            .rotate() // apply the phone's orientation tag before cropping
            .resize(BANNER_WIDTH, BANNER_HEIGHT, {
                fit: "cover", // fill the frame, cropping the overflow
                position: "attention", // keep the most eye-catching part in frame
            })
            .flatten({ background: "#ffffff" }) // JPEG has no transparency
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
    } catch {
        return null;
    }
}

// Turns an uploaded photo into a JPEG for one tier's card, cropped to that
// card's shape at twice its size in the email (e.g. 1300 × 480 for a 650 × 240
// photo). That keeps each one around 100–200KB, so all the email's images
// stay well under Outlook's size limit.
export async function prepareCardImage(file: File, tier: QuoteType): Promise<Buffer | null> {
    const { width, height } = cardImageSize(tier);
    try {
        return await sharp(Buffer.from(await file.arrayBuffer()))
            .rotate()
            .resize(width * 2, height * 2, { fit: "cover", position: "attention" })
            .flatten({ background: "#ffffff" })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
    } catch {
        return null;
    }
}

// Turns an uploaded image into a square PNG incentive icon. It's cropped from
// the centre, the same way the editor's preview crops it. PNG keeps any
// transparency, and Outlook can't show SVG or WebP.
export async function prepareIcon(file: File): Promise<Buffer | null> {
    try {
        return await sharp(Buffer.from(await file.arrayBuffer()))
            .rotate()
            .resize(ICON_SIZE, ICON_SIZE, { fit: "cover", position: "centre" })
            .png({ compressionLevel: 9 })
            .toBuffer();
    } catch {
        return null;
    }
}
