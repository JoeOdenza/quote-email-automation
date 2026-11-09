export type Agent = {
    name: string;
    agentNum: string;
    email: string;
    phone: string;
    schedule: string;
}

export type Incentive = {
    id: string;
    title: string;
    description: string;
    srcImg: string;
}

export type QuoteLayer = {
    price: Quote;
    // Usually the resort, e.g. "Ocean Breeze Resort & Spa, Cancún".
    title: string;
    // Length and dates of the stay, e.g. "7 nights · Mar 12–19, 2027".
    duration: string;
    // The accommodation, e.g. "1-bedroom ocean view suite". May span lines.
    description: string;
    incentives: Incentive[];
    authformLink: string;
    // A photo of the resort or room, shown at the top of the quote's card.
    imageUrl?: string;
}

export type QuoteEmailData = {
    guestName: string;
    guestEmail: string;
    agent: Agent;
    promo: QuoteLayer;
    upgrade: QuoteLayer;
    hailMary: QuoteLayer;
}

export type Quote = {
    price: number;
    currency: string;
}