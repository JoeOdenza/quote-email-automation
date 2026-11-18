// The three quote layers in an email. The keys match QuoteEmailData and the
// quote_type column; the labels are what agents see.
export const quoteTypes = ["promo", "upgrade", "hailMary"] as const;
export type QuoteType = (typeof quoteTypes)[number];

export const tierLabels: Record<QuoteType, string> = {
    promo: "Base",
    upgrade: "Upgrade",
    hailMary: "Premium",
};

export const currencies = ["USD", "CAD"] as const;
export type Currency = (typeof currencies)[number];

// Placeholders for the parts of a quote the form doesn't ask for yet.
export const tierPlaceholders: Record<QuoteType, { authFormLink: string }> = {
    promo: { authFormLink: "https://example.com/auth/promo" },
    upgrade: { authFormLink: "https://example.com/auth/upgrade" },
    hailMary: { authFormLink: "https://example.com/auth/hail-mary" },
};

// The picture in a theme that each tier shows (see libs/themes.ts).
export const tierImageSlots = { promo: "base", upgrade: "upgrade", hailMary: "premium" } as const;

// Example text shown in the empty quote fields.
export const tierExamples: Record<QuoteType, { title: string; nights: string; description: string }> = {
    promo: {
        title: "Ocean Breeze Resort & Spa, Cancún",
        nights: "5",
        description: "Studio with a king bed",
    },
    upgrade: {
        title: "Ocean Breeze Resort & Spa, Cancún",
        nights: "7",
        description: "1-bedroom ocean view suite",
    },
    hailMary: {
        title: "Ocean Breeze Resort & Spa, Cancún",
        nights: "7",
        description: "2-bedroom presidential suite",
    },
};

export const logoSrc = "/OdenzaLogo.png";
