import type { QuoteEmailData, Quote } from "./types";

// Placeholder photos (in public/images, cropped to each slot's size) and
// incentive icons until real resort photos and artwork exist.

const icon = (text: string, background = "e0b13a", color = "14304f") =>
    `https://placehold.co/88x88/${background}/${color}/png?font=roboto&text=${encodeURIComponent(text)}`;

const incentives = {
    dining: {
        id: "dining",
        title: "$100 dining credit",
        description: "Use it at any restaurant on the resort.",
        srcImg: icon("$100"),
    },
    transfer: {
        id: "transfer",
        title: "Free airport transfer",
        description: "Round trip, private car.",
        srcImg: icon("Car"),
    },
    spa: {
        id: "spa",
        title: "Couples spa treatment",
        description: "60-minute massage for two.",
        srcImg: icon("Spa"),
    },
};

const promoQuote: Quote = {
    price: 499.32,
    currency: "USD",
}

const upgradeQuote: Quote = {
    price: 899.64,
    currency: "USD",
}

const hailMaryQuote: Quote = {
    price: 1499.18,
    currency: "USD",
}

export const sampleQuoteEmail: QuoteEmailData = {
    guestName: "Dana Watters",
    guestEmail: "dana@example.com",
    agent: {
        name: "Joe Lin",
        agentNum: "1042",
        email: "joe@odenza.com",
        phone: "1-800-555-0199",
        schedule: "Mon–Fri, 9am–5pm ET",
    },
    promo: {
        price: promoQuote,
        description: "Ocean Breeze Resort & Spa, Cancún\n5 nights · Studio\nMar 12–17, 2027",
        incentives: [],
        authformLink: "https://example.com/auth/promo",
        imageUrl: "/images/promo.jpg",
    },
    upgrade: {
        price: upgradeQuote,
        description: "Ocean Breeze Resort & Spa, Cancún\n7 nights · 1-bedroom ocean view\nMar 12–19, 2027",
        incentives: [incentives.dining],
        authformLink: "https://example.com/auth/upgrade",
        imageUrl: "/images/upgrade.jpg",
    },
    hailMary: {
        price: hailMaryQuote,
        description: "Ocean Breeze Resort & Spa, Cancún\n7 nights · 2-bedroom presidential suite\nMar 12–19, 2027",
        incentives: [incentives.dining, incentives.transfer, incentives.spa],
        authformLink: "https://example.com/auth/hail-mary",
        imageUrl: "/images/hailmary.jpg",
    },
};

export const sampleHeroSrc = "/images/hero.jpg";
