// Rules for email themes (the Themes page), shared by the editor form and the
// server. A theme is a name, one of the preset colour schemes
// (libs/color-schemes.ts) and four pictures. Themes are shared by everyone.
import { bannerSize, cardImageSize } from "./email-layout";

export const THEME_NAME_MAX = 40;

// The four pictures in a theme, in the order the form asks for them.
export const themeImageSlots = ["banner", "base", "upgrade", "premium"] as const;
export type ThemeImageSlot = (typeof themeImageSlots)[number];

export const themeImageLabels: Record<ThemeImageSlot, string> = {
    banner: "Banner",
    base: "Base quote photo",
    upgrade: "Upgrade quote photo",
    premium: "Premium quote photo",
};

// The size each picture shows at in the email. Uploads are cropped to this
// shape (at twice the size, for sharp screens), because classic Outlook
// stretches images instead of cropping them.
export function themeImageSize(slot: ThemeImageSlot): { width: number; height: number } {
    if (slot === "banner") return bannerSize();
    return cardImageSize(slot === "base" ? "promo" : slot === "upgrade" ? "upgrade" : "hailMary");
}

// What the uploader accepts. Full-size phone and camera photos are fine; each
// is shrunk to roughly 100KB. next.config.ts's bodySizeLimit leaves room for
// all four at the maximum size.
export const themeImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const themeImageMaxBytes = 10 * 1024 * 1024;
export const themeImageMaxLabel = "10MB";
