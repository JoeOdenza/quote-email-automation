import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Everything here is keyed off SESSION_SECRET. Changing it signs everyone
// out, since stored tokens and cookies can no longer be read.

function secret(): string {
    const value = process.env.SESSION_SECRET;
    if (!value || value.length < 32) {
        throw new Error("SESSION_SECRET must be set in .env.local (at least 32 characters).");
    }
    return value;
}

const key = () => createHash("sha256").update(`quote-email:encryption:${secret()}`).digest();

// AES-256-GCM: unreadable without the key, and any tampering is detected.
// Output is "iv.tag.ciphertext", each part base64url.
export function encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64url")).join(".");
}

// Returns null if the value was tampered with or encrypted under another key.
export function decrypt(value: string): string | null {
    try {
        const [iv, tag, data] = value.split(".").map((part) => Buffer.from(part, "base64url"));
        const decipher = createDecipheriv("aes-256-gcm", key(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    } catch {
        return null;
    }
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const sha256 = (value: string) => createHash("sha256").update(value).digest("base64url");
