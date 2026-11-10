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
export const tierPlaceholders: Record<QuoteType, { imageSrc: string; authFormLink: string }> = {
    promo: {
        imageSrc: "/images/himalayas-promo-card.jpg",
        authFormLink: "https://example.com/auth/promo",
    },
    upgrade: {
        imageSrc: "/images/himalayas-upgrade-card.jpg",
        authFormLink: "https://example.com/auth/upgrade",
    },
    hailMary: {
        imageSrc: "/images/himalayas-hailmary-card.jpg",
        authFormLink: "https://example.com/auth/hail-mary",
    },
};

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

// Used when no banner is uploaded.
export const heroSrc = "/images/hero-banner.jpg";
export const logoSrc = "/OdenzaLogo.png";

// Photo uploads (the banner and each tier's photo): what the form accepts and
// how big each file can be. They're shrunk on upload, so this only has to
// allow a full-size phone or camera photo. next.config.ts's bodySizeLimit has
// to fit all four at once.
export const photoImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const photoImageMaxBytes = 10 * 1024 * 1024;
export const photoImageMaxLabel = "10MB";
