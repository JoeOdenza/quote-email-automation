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