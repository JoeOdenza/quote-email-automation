import "server-only";
import sharp from "sharp";

// The banner shows at 600 × 220 in the email; it's stored at twice that so
// it stays sharp on high-density screens.
export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 440;

// Turns an uploaded photo into a 1200 × 440 JPEG. Email clients like Outlook
// ignore CSS cropping, so the image has to arrive at exactly the right shape.
// Returns null if the file isn't a readable image.
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
