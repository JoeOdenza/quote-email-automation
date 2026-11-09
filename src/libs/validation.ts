// Input rules shared by the quote form (as HTML patterns) and the server.

// A dollar amount: whole dollars with optional cents (one or two digits), and
// optional thousands commas and dollar sign. e.g. 1299, 1299.5, $1,299.50
// (HTML pattern attributes are matched against the whole value.)
export const PRICE_PATTERN = String.raw`\$?(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?`;
const PRICE_RE = new RegExp(`^${PRICE_PATTERN}$`);

// Parses a price to cents, working on the text so nothing is lost to
// floating-point rounding. Returns null if it isn't a valid amount above zero.
export function parsePriceCents(value: string): number | null {
    const trimmed = value.trim();
    if (!PRICE_RE.test(trimmed)) return null;
    const [dollars, cents = ""] = trimmed.replace("$", "").replaceAll(",", "").split(".");
    const total = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
    return Number.isSafeInteger(total) && total > 0 ? total : null;
}

// ClientBase profile numbers: exactly six digits.
export const PROFILE_NUM_PATTERN = String.raw`\d{6}`;
export const isProfileNum = (value: string) => /^\d{6}$/.test(value);
