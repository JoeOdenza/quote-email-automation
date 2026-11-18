import "server-only";
import sharp from "sharp";
import { ICON_SIZE } from "./incentives";
import { themeImageSize, type ThemeImageSlot } from "./themes";

// Uploaded images are reshaped here, on the server, because email clients
// like Outlook ignore CSS cropping: each image has to arrive at exactly the
// size and shape it's shown at. Each function returns null if the file isn't
// a readable image.

// Turns an uploaded photo into a JPEG for one of a theme's pictures, cropped
// to that picture's shape at twice its size in the email (e.g. 1440 × 400 for
// the 720 × 200 banner), keeping the most eye-catching part in frame. That
// keeps each one around 100–200KB, so the email stays well under Outlook's
// size limit.
export async function prepareThemeImage(file: File, slot: ThemeImageSlot): Promise<Buffer | null> {
    const { width, height } = themeImageSize(slot);
    try {
        return await sharp(Buffer.from(await file.arrayBuffer()))
            .rotate() // apply the phone's orientation tag before cropping
            .resize(width * 2, height * 2, { fit: "cover", position: "attention" })
            .flatten({ background: "#ffffff" }) // JPEG has no transparency
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
