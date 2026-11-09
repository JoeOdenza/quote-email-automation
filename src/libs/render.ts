import { withBasePath } from "./base-path";
import type { Agent, Incentive, QuoteEmailData, QuoteLayer, Quote } from "./types";

const FONT = "font-family:Arial,Helvetica,sans-serif;";

// The email is 720px wide; content sits inside 32px side padding. Wider than
// the classic 600px so it fills more of a desktop reading pane. Classic
// Outlook keeps it at exactly this width; other apps shrink it to fit phones
// (see RESPONSIVE_CSS).
export const EMAIL_WIDTH = 720;
const GUTTER = 32;
const CONTENT_WIDTH = EMAIL_WIDTH - GUTTER * 2;

// Placeholder brand colours until Renato picks real ones.
const COLORS = {
    page: "#eef1f5",
    text: "#2b2f36",
    muted: "#6b7280",
    border: "#dde3ea",
    navy: "#14304f",
    navySoft: "#c9d6e6",
    blue: "#0045a5",
    teal: "#0f766e",
    tealSoft: "#e6f4f2",
    tealDeep: "#0b4f4a",
    tealDark: "#083c38",
    gold: "#e0b13a",
    goldSoft: "#fdf6e3",
    paleBlue: "#f4f7fb",
};

function esc(value: string | number): string {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// Agents type descriptions over several lines; keep their line breaks.
function escMultiline(value: string): string {
    return esc(value).replaceAll(/\r?\n/g, "<br>");
}

// Currency is a guess (CAD) until we know what quotes are priced in.
function formatPrice(price: Quote): string {
    const currencyType = price.currency == "USD" ? "en-US" : "en-CA"

    const value = new Intl.NumberFormat(currencyType, { style: "currency", currency: price.currency}).format(price.price)

    return `${value} ${price.currency}`
}

// Images can be given as site paths ("/images/promo.jpg"). They get the app's
// base path, and when a baseUrl is given they're made into full URLs, which an
// email needs since it's read outside the app.
function imageUrl(src: string, baseUrl: string | undefined): string {
    const path = withBasePath(src);
    return baseUrl ? new URL(path, baseUrl).href : path;
}

function resolveImages(data: QuoteEmailData, baseUrl: string | undefined): QuoteEmailData {
    const url = (src: string) => imageUrl(src, baseUrl);
    const layer = (quote: QuoteLayer): QuoteLayer => ({
        ...quote,
        imageUrl: quote.imageUrl && url(quote.imageUrl),
        incentives: quote.incentives.map((incentive) => ({ ...incentive, srcImg: url(incentive.srcImg) })),
    });
    return { ...data, promo: layer(data.promo), upgrade: layer(data.upgrade), hailMary: layer(data.hailMary) };
}

// The subject line used when the email is saved to Outlook.
export const QUOTE_EMAIL_SUBJECT = "Odenza Vacations: Your Travel Quotes";

function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? "";
}

// Classic Outlook for Windows lays emails out with Word, which ignores
// margins on tables, padding on links and rounded corners. The helpers below
// avoid relying on those.

// Vertical space that every client honours. Word ignores margins on tables
// and squashes empty cells, so the cell gets an exact line height, and it's
// painted the colour of whatever it sits on (Word otherwise shows it white).
function vSpace(height: number, background: string): string {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="${height}" bgcolor="${background}" style="height:${height}px;font-size:${height}px;line-height:${height}px;mso-line-height-rule:exactly;">&nbsp;</td></tr>
    </table>`;
}

type ButtonOptions = {
    background: string;
    color?: string;
    fontSize?: number;
};

const BUTTON_PAD_Y = 14;
const BUTTON_LINE = 20;
const BUTTON_RADIUS = 6;
const BUTTON_EDGE = 4;

// Darkens a #rrggbb colour by a fraction (0.2 = 20% darker).
function darken(hex: string, amount: number): string {
    const value = parseInt(hex.slice(1), 16);
    const channel = (shift: number) => Math.round(((value >> shift) & 0xff) * (1 - amount));
    return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, "0")).join("")}`;
}

// A full-width button that looks like a button everywhere. Its height comes
// from ordinary padding on the cell, which every client applies the same way:
// - padding on the link is ignored by classic Outlook;
// - Outlook-only cell padding (mso-padding-alt) became real padding when the
//   email was forwarded from Outlook, doubling the button's height;
// - a tall line height on the link puts all the extra space above the text
//   in classic Outlook.
// The link fills the button's width, so it's clickable across the middle.
// Outlook can't round the corners, so the button gets a darker outline and a
// thick darker bottom edge, which Word does draw, for a raised look.
function button(url: string, label: string, options: ButtonOptions): string {
    const { background, color = "#ffffff", fontSize = 16 } = options;
    const outline = darken(background, 0.12);
    const edge = darken(background, 0.3);
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" bgcolor="${background}" style="border:1px solid ${outline};border-bottom:${BUTTON_EDGE}px solid ${edge};border-radius:${BUTTON_RADIUS}px;padding:${BUTTON_PAD_Y}px 16px;">
                <a href="${esc(url)}" style="display:block;${FONT}font-size:${fontSize}px;line-height:${BUTTON_LINE}px;mso-line-height-rule:exactly;font-weight:bold;color:${color};text-decoration:none;border-radius:${BUTTON_RADIUS}px;">${esc(label)}</a>
            </td>
        </tr>
    </table>`;
}

// A small coloured label, e.g. "UPGRADE".
function badge(label: string, background: string, color: string): string {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td bgcolor="${background}" style="padding:5px 10px;border-radius:12px;${FONT}font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${color};">${esc(label)}</td>
        </tr>
    </table>`;
}

function spacer(height: number): string {
    return `<tr><td height="${height}" style="height:${height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

// The logo's actual pixel size (public/OdenzaLogo.png). Update these if the
// logo file changes, or Outlook will stretch it to the old shape.
const LOGO_WIDTH = 249;
const LOGO_HEIGHT = 45;

function header(agent: Agent, logoSrc: string): string {
    return `
    <tr>
        <td class="pad" bgcolor="${COLORS.navy}" style="padding:20px ${GUTTER}px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="50%" valign="middle">
                        <img src="${esc(logoSrc)}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="Odenza" style="display:block;border:0;width:${LOGO_WIDTH}px;height:${LOGO_HEIGHT}px;">
                    </td>
                    <td width="50%" valign="middle" align="right" style="${FONT}font-size:13px;line-height:20px;color:${COLORS.navySoft};">
                        <span style="font-size:15px;font-weight:bold;color:#ffffff;">${esc(agent.name)}</span><br>
                        Agent #${esc(agent.agentNum)}<br>
                        <a href="mailto:${esc(agent.email)}" style="color:#ffffff;text-decoration:underline;">${esc(agent.email)}</a><br>
                        ${esc(agent.phone)}<br>
                        ${esc(agent.schedule)}
                    </td>
                </tr>
            </table>
        </td>
    </tr>`;
}

// The banner's height. Uploaded banners are cropped to this shape (see
// libs/images.ts), so changing it changes what new uploads are cropped to.
// The default banner is a copy cropped to match (images/hero-banner.jpg).
export const HERO_HEIGHT = 200;

function intro(guestName: string, heroSrc: string | undefined): string {
    const hero = heroSrc
        ? `
    <tr>
        <td>
            <img class="fluid-img" src="${esc(heroSrc)}" width="${EMAIL_WIDTH}" height="${HERO_HEIGHT}" alt="" style="display:block;border:0;width:${EMAIL_WIDTH}px;height:${HERO_HEIGHT}px;object-fit:cover;">
        </td>
    </tr>`
        : "";

    return `${hero}
    <tr>
        <td class="pad" style="padding:32px ${GUTTER}px 8px;${FONT}color:${COLORS.text};">
            <h1 style="margin:0 0 12px;font-size:24px;line-height:30px;color:${COLORS.navy};">Hi ${esc(firstName(guestName))},</h1>
            <p style="margin:0;font-size:15px;line-height:24px;color:${COLORS.text};">
                Thanks for talking with me about your next getaway. Below is the quote we discussed,
                plus two upgrades I picked out for you. Each option has its own link, so you can
                reserve whichever one feels right.
            </p>
        </td>
    </tr>`;
}

type IncentiveStyle = {
    background: string;
    titleColor: string;
    textColor: string;
};

// `background` is the colour of the card the list sits on (for the spacer above it).
function incentiveList(incentives: Incentive[], style: IncentiveStyle, background: string): string {
    if (incentives.length === 0) return "";

    const rows = incentives
        .map(
            (incentive) => `
                <tr>
                    <td width="56" valign="top" style="padding:8px 12px 8px 0;">
                        <img src="${esc(incentive.srcImg)}" width="44" height="44" alt="" style="display:block;border:0;width:44px;height:44px;border-radius:22px;">
                    </td>
                    <td valign="middle" style="padding:8px 0;${FONT}font-size:14px;line-height:20px;color:${style.textColor};">
                        <strong style="color:${style.titleColor};">${esc(incentive.title)}</strong><br>
                        ${escMultiline(incentive.description)}
                    </td>
                </tr>`,
        )
        .join("");

    return `${vSpace(20, background)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td bgcolor="${style.background}" style="padding:12px 16px;border-radius:8px;">
                <p style="margin:0 0 4px;${FONT}font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${style.titleColor};">Bonus incentives included</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
                </table>
            </td>
        </tr>
    </table>`;
}

// The three layers share one card layout; they differ in colours, sizes and labels.
type CardStyle = {
    badge: string;
    badgeBackground: string;
    badgeColor: string;
    background: string;
    borderColor: string;
    borderWidth: number;
    titleColor: string;
    textColor: string;
    mutedColor: string;
    titleSize: number;
    priceSize: number;
    imageHeight: number;
    buttonLabel: string;
    buttonBackground: string;
    buttonColor: string;
    buttonSize: number;
    incentives: IncentiveStyle;
    // Optional extras that make a card stand out (used by the upgrade).
    ribbon?: { label: string; background: string; color: string };
    priceBackground?: string;
    shadow?: string;
    // Colour of the line under the price (defaults to the badge colour).
    priceNoteColor?: string;
};

// `priceNote` is an optional line under the price, e.g. how much more than
// the original quote this one is.
function quoteCard(quote: QuoteLayer, style: CardStyle, priceNote?: string): string {
    const title = quote.title.trim();
    const imageWidth = CONTENT_WIDTH - style.borderWidth * 2;

    const image = quote.imageUrl
        ? `
                <tr>
                    <td>
                        <img class="fluid-img" src="${esc(quote.imageUrl)}" width="${imageWidth}" height="${style.imageHeight}" alt="${esc(title)}" style="display:block;border:0;width:${imageWidth}px;height:${style.imageHeight}px;object-fit:cover;">
                    </td>
                </tr>`
        : "";

    const duration = quote.duration.trim()
        ? `<p style="margin:0 0 6px;font-size:14px;line-height:22px;font-weight:bold;color:${style.textColor};">${esc(quote.duration.trim())}</p>`
        : "";
    const description = quote.description.trim()
        ? `<p style="margin:0;font-size:14px;line-height:22px;color:${style.mutedColor};">${escMultiline(quote.description.trim())}</p>`
        : "";

    // A full-width band across the top of the card, e.g. "Most popular".
    const ribbon = style.ribbon
        ? `
                <tr>
                    <td align="center" bgcolor="${style.ribbon.background}" style="padding:10px 16px;${FONT}font-size:13px;line-height:18px;mso-line-height-rule:exactly;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${style.ribbon.color};">${esc(style.ribbon.label)}</td>
                </tr>`
        : "";

    // The price sits on its own tinted panel when the style asks for one. The
    // space above it is padding on the outer cell rather than a vSpace, since
    // classic Outlook leaves a white seam between a spacer and the table after
    // it (visible on dark cards).
    const panel = style.priceBackground;
    const price = `
                                    <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${style.mutedColor};">Total for your stay</span><br>
                                    <span style="font-size:${style.priceSize}px;line-height:1.2;font-weight:bold;color:${style.titleColor};">${esc(formatPrice(quote.price))}</span>${
                                        priceNote
                                            ? `<br><span style="font-size:14px;line-height:22px;font-weight:bold;color:${style.priceNoteColor ?? style.badgeColor};">${esc(priceNote)}</span>`
                                            : ""
                                    }`;
    const priceBlock = `
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${style.background}">
                            <tr>
                                <td valign="bottom" bgcolor="${style.background}" style="padding-top:20px;${FONT}">${
                                    panel
                                        ? `
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td bgcolor="${panel}" style="padding:16px 18px;border-radius:8px;${FONT}">${price}
                                            </td>
                                        </tr>
                                    </table>`
                                        : price
                                }
                                </td>
                            </tr>
                        </table>`;

    return `
    <tr>
        <td class="pad" style="padding:0 ${GUTTER}px;">
            <table class="fluid" role="presentation" width="${CONTENT_WIDTH}" cellpadding="0" cellspacing="0" border="0" bgcolor="${style.background}" style="width:${CONTENT_WIDTH}px;border:${style.borderWidth}px solid ${style.borderColor};border-radius:12px;border-collapse:separate;overflow:hidden;${style.shadow ? `box-shadow:${style.shadow};` : ""}">
                ${ribbon}
                ${image}
                <tr>
                    <td bgcolor="${style.background}" style="padding:24px;${FONT}color:${style.textColor};">
                        ${badge(style.badge, style.badgeBackground, style.badgeColor)}
                        <h2 style="margin:14px 0 6px;font-size:${style.titleSize}px;line-height:1.25;color:${style.titleColor};">${esc(title)}</h2>
                        ${duration}
                        ${description}
                        ${priceBlock}
                        ${vSpace(16, style.background)}
                        ${button(quote.authformLink, style.buttonLabel, {
                            background: style.buttonBackground,
                            color: style.buttonColor,
                            fontSize: style.buttonSize,
                        })}
                        ${incentiveList(quote.incentives, style.incentives, style.background)}
                    </td>
                </tr>
            </table>
        </td>
    </tr>`;
}

// Keyed like QuoteEmailData: promo, upgrade, hailMary.
//
// The upgrade (middle) is the one we most want guests to pick, so it gets the
// most attention: a "most popular" ribbon, the thickest border, the biggest
// image, price and button, a tinted price panel and a shadow. The other two
// are deliberately quieter so it stands out between them.
const CARD_STYLES = {
    promo: {
        badge: "Your quote",
        badgeBackground: COLORS.paleBlue,
        badgeColor: COLORS.blue,
        background: "#ffffff",
        borderColor: COLORS.border,
        borderWidth: 1,
        titleColor: COLORS.navy,
        textColor: COLORS.text,
        mutedColor: COLORS.muted,
        titleSize: 20,
        priceSize: 26,
        imageHeight: 200,
        buttonLabel: "Reserve this offer",
        buttonBackground: COLORS.blue,
        buttonColor: "#ffffff",
        buttonSize: 16,
        incentives: { background: COLORS.paleBlue, titleColor: COLORS.navy, textColor: COLORS.text },
    },
    // A deep teal card with gold accents: the only shaded card in the email.
    upgrade: {
        badge: "Recommended for you",
        badgeBackground: COLORS.tealSoft,
        badgeColor: COLORS.teal,
        background: COLORS.tealDeep,
        borderColor: COLORS.gold,
        borderWidth: 3,
        titleColor: "#ffffff",
        textColor: "#ffffff",
        mutedColor: "#b9ded9",
        titleSize: 26,
        priceSize: 36,
        imageHeight: 240,
        buttonLabel: "Reserve the upgrade",
        buttonBackground: COLORS.gold,
        buttonColor: COLORS.navy,
        buttonSize: 18,
        incentives: { background: COLORS.tealDark, titleColor: COLORS.gold, textColor: "#ffffff" },
        ribbon: { label: "★ Most popular choice ★", background: COLORS.gold, color: COLORS.navy },
        priceBackground: COLORS.tealDark,
        priceNoteColor: COLORS.gold,
        shadow: "0 12px 32px rgba(11,79,74,0.35)",
    },
    hailMary: {
        badge: "Premium option",
        badgeBackground: COLORS.goldSoft,
        badgeColor: "#8a6a12",
        background: "#ffffff",
        borderColor: COLORS.navy,
        borderWidth: 2,
        titleColor: COLORS.navy,
        textColor: COLORS.text,
        mutedColor: COLORS.muted,
        titleSize: 22,
        priceSize: 28,
        imageHeight: 220,
        buttonLabel: "Reserve the ultimate getaway",
        buttonBackground: COLORS.navy,
        buttonColor: "#ffffff",
        buttonSize: 16,
        incentives: { background: COLORS.goldSoft, titleColor: COLORS.navy, textColor: COLORS.text },
    },
} satisfies Record<string, CardStyle>;

type Tier = keyof typeof CARD_STYLES;

// How one incentive looks inside each of the three quote cards, for the
// incentive editor's live preview. Uses the same markup as the real email.
export function renderIncentivePreview(incentive: Incentive, labels: Record<Tier, string>): string {
    const tiers = Object.keys(CARD_STYLES) as Tier[];
    const cards = tiers
        .map((tier) => {
            const style = CARD_STYLES[tier];
            return `
            <p style="margin:0 0 6px;${FONT}font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};">${esc(labels[tier])} quote</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${style.background}" style="border:${style.borderWidth}px solid ${style.borderColor};border-radius:10px;border-collapse:separate;margin-bottom:16px;">
                <tr>
                    <td style="padding:0 24px 20px;">${incentiveList([{ ...incentive, srcImg: withBasePath(incentive.srcImg) }], style.incentives, style.background)}</td>
                </tr>
            </table>`;
        })
        .join("");

    return `<!DOCTYPE html>
<html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:16px;background-color:${COLORS.page};">
        <div style="max-width:${CONTENT_WIDTH}px;margin:0 auto;">${cards}
        </div>
    </body>
</html>`;
}

function footer(agent: Agent): string {
    return `
    <tr>
        <td bgcolor="${COLORS.paleBlue}" style="padding:24px;border-top:1px solid ${COLORS.border};${FONT}font-size:14px;line-height:22px;color:${COLORS.text};" align="center">
            Questions? Reply to this email or call me at
            <strong style="color:${COLORS.navy};">${esc(agent.phone)}</strong>.<br>
            <span style="color:${COLORS.muted};">${esc(agent.name)} · Odenza Vacations · Agent #${esc(agent.agentNum)}</span>
            <p style="margin:16px 0 0;font-size:11px;line-height:16px;color:${COLORS.muted};">
                Placeholder for any footer information
            </p>
        </td>
    </tr>`;
}

// "Just $350.00 USD more than your original quote", when the upgrade is in
// the same currency and costs more. Shown on the upgrade card.
function upgradeNote(promo: Quote, upgrade: Quote): string | undefined {
    if (promo.currency !== upgrade.currency) return undefined;
    const difference = Math.round((upgrade.price - promo.price) * 100) / 100;
    if (difference <= 0) return undefined;
    return `Just ${formatPrice({ ...upgrade, price: difference })} more than your original quote`;
}

// On phones, apps that support it shrink the fixed-width layout to the
// screen. Classic Outlook ignores this and keeps the fixed widths.
const RESPONSIVE_CSS = `
            @media only screen and (max-width: ${EMAIL_WIDTH + 20}px) {
                .container, .fluid, .fluid-img { width: 100% !important; }
                .pad { padding-left: 16px !important; padding-right: 16px !important; }
            }`;

export function renderQuoteEmail(
    data: QuoteEmailData,
    options: { logoSrc: string; heroSrc?: string; baseUrl?: string },
): string {
    const { baseUrl } = options;
    const logoSrc = imageUrl(options.logoSrc, baseUrl);
    const heroSrc = options.heroSrc && imageUrl(options.heroSrc, baseUrl);
    data = resolveImages(data, baseUrl);

    return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <!--[if mso]>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <style>${RESPONSIVE_CSS}
        </style>
    </head>
    <body style="margin:0;padding:0;background-color:${COLORS.page};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.page}">
            <tr>
                <td align="center" style="padding:24px 0;">
                    <table class="container" role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:${EMAIL_WIDTH}px;">
                        ${header(data.agent, logoSrc)}
                        ${intro(data.guestName, heroSrc)}
                        ${spacer(24)}
                        ${quoteCard(data.promo, CARD_STYLES.promo)}
                        ${spacer(24)}
                        ${quoteCard(data.upgrade, CARD_STYLES.upgrade, upgradeNote(data.promo.price, data.upgrade.price))}
                        ${spacer(24)}
                        ${quoteCard(data.hailMary, CARD_STYLES.hailMary)}
                        ${spacer(32)}
                        ${footer(data.agent)}
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}
