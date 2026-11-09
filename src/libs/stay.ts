// Trip dates are stored as plain calendar dates ("2027-03-12"), with no time
// or time zone, so a stay never shifts a day depending on where it's viewed.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// A real calendar date in YYYY-MM-DD form (rejects e.g. 2027-02-30).
export function isIsoDate(value: string): boolean {
    if (!ISO_DATE.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function nightsBetween(checkIn: string, checkOut: string): number {
    return Math.round((utc(checkOut).getTime() - utc(checkIn).getTime()) / 86_400_000);
}

// Calendar widgets work with local Date objects; these convert to and from
// the stored form without going through UTC (which could change the day).
export function toIsoDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(iso: string | undefined): Date | undefined {
    if (!iso || !isIsoDate(iso)) return undefined;
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
}

const part = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(utc(iso));

// "Mar 12–17, 2027", "Mar 28 – Apr 2, 2027" or "Dec 28, 2026 – Jan 4, 2027".
export function formatStayDates(checkIn: string, checkOut: string): string {
    const [inYear, outYear] = [checkIn.slice(0, 4), checkOut.slice(0, 4)];
    const [inMonth, outMonth] = [checkIn.slice(5, 7), checkOut.slice(5, 7)];
    if (inYear !== outYear) {
        return `${part(checkIn, { month: "short", day: "numeric", year: "numeric" })} – ${part(checkOut, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (inMonth !== outMonth) {
        return `${part(checkIn, { month: "short", day: "numeric" })} – ${part(checkOut, { month: "short", day: "numeric" })}, ${inYear}`;
    }
    return `${part(checkIn, { month: "short", day: "numeric" })}–${part(checkOut, { day: "numeric" })}, ${inYear}`;
}

// The line shown in the email, e.g. "5 nights · Mar 12–17, 2027".
export function formatStay(nights: number, checkIn: string, checkOut: string): string {
    return `${nights} ${nights === 1 ? "night" : "nights"} · ${formatStayDates(checkIn, checkOut)}`;
}

export const MAX_NIGHTS = 365;
