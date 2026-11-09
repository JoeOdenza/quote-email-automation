import type { QuoteEmailData, Quote } from "./types";

// Placeholder photos (in public/images, cropped to each slot's size) and
// incentive icons until real resort photos and artwork exist.

const icon = (text: string, background = "e0b13a", color = "14304f") =>
    `https://placehold.co/88x88/${background}/${color}/png?font=roboto&text=${encodeURIComponent(text)}`;

const incentives = {
    travel: {
        id: "travel",
        title: "$150 future travel credit",
        description: "Put it toward your next trip booked with Odenza.",
        srcImg: icon("$150"),
    },
    hotel: {
        id: "hotel",
        title: "$500 hotel credit",
        description: "Use it at any Odenza partner hotel.",
        srcImg: icon("$500"),
    },
    event: {
        id: "event",
        title: "Event tickets",
        description: "Choose from a selection of sports and live event tickets.",
        srcImg: icon("VIP"),
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
        title: "Ocean Breeze Resort & Spa, Cancún",
        duration: "5 nights · Mar 12–17, 2027",
        description: "Studio with a king bed",
        incentives: [],
        authformLink: "https://example.com/auth/promo",
        imageUrl: "/images/promo.jpg",
    },
    upgrade: {
        price: upgradeQuote,
        title: "Ocean Breeze Resort & Spa, Cancún",
        duration: "7 nights · Mar 12–19, 2027",
        description: "1-bedroom ocean view suite",
        incentives: [incentives.travel],
        authformLink: "https://example.com/auth/upgrade",
        imageUrl: "/images/upgrade.jpg",
    },
    hailMary: {
        price: hailMaryQuote,
        title: "Ocean Breeze Resort & Spa, Cancún",
        duration: "7 nights · Mar 12–19, 2027",
        description: "2-bedroom presidential suite",
        incentives: [incentives.travel, incentives.hotel, incentives.event],
        authformLink: "https://example.com/auth/hail-mary",
        imageUrl: "/images/hailmary.jpg",
    },
};

export const sampleHeroSrc = "/images/hero.jpg";
