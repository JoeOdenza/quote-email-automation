export function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatMoney(cents: number, currency: string): string {
    const locale = currency === "USD" ? "en-US" : "en-CA";
    const value = new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
    return `${value} ${currency}`;
}
