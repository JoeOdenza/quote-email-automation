import "server-only";
import sharp from "sharp";
import { ICON_SIZE } from "./incentives";

// Uploaded images are reshaped here, on the server, because email clients
// like Outlook ignore CSS cropping: each image has to arrive at exactly the
// size and shape it's shown at. Each function returns null if the file isn't
// a readable image.

// The banner shows at 600 × 220 in the email; it's stored at twice that so
// it stays sharp on high-density screens.
export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 440;

// Turns an uploaded photo into a 1200 × 440 JPEG.
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
