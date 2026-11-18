// Sizes in the quote email that images are cropped to fit. No imports, so
// the browser (the theme editor) can use it too.

// The email is 720px wide; content sits inside 32px side padding. Wider than
// the classic 600px so it fills more of a desktop reading pane. Classic
// Outlook keeps it at exactly this width; other apps shrink it to fit phones.
export const EMAIL_WIDTH = 720;
export const GUTTER = 32;
export const CONTENT_WIDTH = EMAIL_WIDTH - GUTTER * 2;

// The banner's height.
export const HERO_HEIGHT = 200;

// Each tier's card border and photo height. The upgrade (middle) has the
// thickest border and the tallest photo, so it stands out.
export const TIER_LAYOUT = {
    promo: { borderWidth: 1, imageHeight: 200 },
    upgrade: { borderWidth: 3, imageHeight: 240 },
    hailMary: { borderWidth: 2, imageHeight: 220 },
} as const;

export type Tier = keyof typeof TIER_LAYOUT;

// The size a tier's photo shows at: the card's full inner width (inside its
// border) by its photo height. Classic Outlook stretches images to their width
// and height instead of cropping them, so photos are pre-cropped to this shape.
export function cardImageSize(tier: Tier): { width: number; height: number } {
    const { borderWidth, imageHeight } = TIER_LAYOUT[tier];
    return { width: CONTENT_WIDTH - borderWidth * 2, height: imageHeight };
}

export function bannerSize(): { width: number; height: number } {
    return { width: EMAIL_WIDTH, height: HERO_HEIGHT };
}
