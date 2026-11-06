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
// The first line of a description is the card's title.
export const tierPlaceholders: Record<
    QuoteType,
    { description: string; imageSrc: string; authFormLink: string }
> = {
    promo: {
        description: "Ocean Breeze Resort & Spa, Cancún\n5 nights · Studio",
        imageSrc: "/images/promo.jpg",
        authFormLink: "https://example.com/auth/promo",
    },
    upgrade: {
        description: "Ocean Breeze Resort & Spa, Cancún\n7 nights · 1-bedroom ocean view",
        imageSrc: "/images/upgrade.jpg",
        authFormLink: "https://example.com/auth/upgrade",
    },
    hailMary: {
        description: "Ocean Breeze Resort & Spa, Cancún\n7 nights · 2-bedroom presidential suite",
        imageSrc: "/images/hailmary.jpg",
        authFormLink: "https://example.com/auth/hail-mary",
    },
};

export const heroSrc = "/images/hero.jpg";
export const logoSrc = "/OdenzaLogo.png";
