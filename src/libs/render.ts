import type { Agent, Incentive, QuoteEmailData, QuoteLayer } from "./types";

const FONT = "font-family:Arial,Helvetica,sans-serif;";

// The email is 600px wide; content sits inside 24px side padding.
const EMAIL_WIDTH = 600;
const GUTTER = 24;
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
function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(price);
}

// The first line of a description is the card's title (usually the resort);
// the rest are details (nights, room, dates).
function splitDescription(description: string): { title: string; details: string[] } {
    const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return { title: lines[0] ?? "", details: lines.slice(1) };
}

// Images can be given as site paths ("/images/promo.jpg"). An email needs full
// URLs, since it's read outside the app, so they're resolved against baseUrl.
function resolveImages(data: QuoteEmailData, baseUrl: string): QuoteEmailData {
    const url = (src: string) => new URL(src, baseUrl).href;
    const layer = (quote: QuoteLayer): QuoteLayer => ({
        ...quote,
        imageUrl: quote.imageUrl && url(quote.imageUrl),
        incentives: quote.incentives.map((incentive) => ({ ...incentive, srcImg: url(incentive.srcImg) })),
    });
    return { ...data, promo: layer(data.promo), upgrade: layer(data.upgrade), hailMary: layer(data.hailMary) };
}

function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? "";
}

type ButtonOptions = {
    background: string;
    color?: string;
    fontSize?: number;
    fullWidth?: boolean;
};

// A link inside a table cell: Outlook drops padding on a styled <a> alone.
function button(url: string, label: string, options: ButtonOptions): string {
    const { background, color = "#ffffff", fontSize = 16, fullWidth = false } = options;
    return `
    <table role="presentation" ${fullWidth ? 'width="100%"' : ""} cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" bgcolor="${background}" style="border-radius:6px;">
                <a href="${esc(url)}" style="display:${fullWidth ? "block" : "inline-block"};padding:14px 28px;${FONT}font-size:${fontSize}px;font-weight:bold;color:${color};text-decoration:none;border-radius:6px;">${esc(label)}</a>
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

function header(agent: Agent, logoSrc: string): string {
    return `
    <tr>
        <td bgcolor="${COLORS.navy}" style="padding:20px ${GUTTER}px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="50%" valign="middle">
                        <img src="${esc(logoSrc)}" width="170" height="60" alt="Odenza" style="display:block;border:0;width:170px;height:60px;">
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

function intro(guestName: string, heroSrc: string | undefined): string {
    const hero = heroSrc
        ? `
    <tr>
        <td>
            <img src="${esc(heroSrc)}" width="${EMAIL_WIDTH}" height="220" alt="" style="display:block;border:0;width:${EMAIL_WIDTH}px;height:220px;object-fit:cover;">
        </td>
    </tr>`
        : "";

    return `${hero}
    <tr>
        <td style="padding:32px ${GUTTER}px 8px;${FONT}color:${COLORS.text};">
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

function incentiveList(incentives: Incentive[], style: IncentiveStyle): string {
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

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
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
};

function quoteCard(quote: QuoteLayer, style: CardStyle): string {
    const { title, details } = splitDescription(quote.description);
    const imageWidth = CONTENT_WIDTH - style.borderWidth * 2;

    const image = quote.imageUrl
        ? `
                <tr>
                    <td>
                        <img src="${esc(quote.imageUrl)}" width="${imageWidth}" height="${style.imageHeight}" alt="${esc(title)}" style="display:block;border:0;width:${imageWidth}px;height:${style.imageHeight}px;object-fit:cover;">
                    </td>
                </tr>`
        : "";

    const detailLines = details.map((line) => esc(line)).join("<br>");

    return `
    <tr>
        <td style="padding:0 ${GUTTER}px;">
            <table role="presentation" width="${CONTENT_WIDTH}" cellpadding="0" cellspacing="0" border="0" bgcolor="${style.background}" style="width:${CONTENT_WIDTH}px;border:${style.borderWidth}px solid ${style.borderColor};border-radius:10px;border-collapse:separate;overflow:hidden;">
                ${image}
                <tr>
                    <td style="padding:24px;${FONT}color:${style.textColor};">
                        ${badge(style.badge, style.badgeBackground, style.badgeColor)}
                        <h2 style="margin:14px 0 6px;font-size:${style.titleSize}px;line-height:1.25;color:${style.titleColor};">${esc(title)}</h2>
                        <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:${style.mutedColor};">${detailLines}</p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td valign="bottom" style="${FONT}">
                                    <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${style.mutedColor};">Total for your stay</span><br>
                                    <span style="font-size:${style.priceSize}px;line-height:1.2;font-weight:bold;color:${style.titleColor};">${esc(formatPrice(quote.price))}</span>
                                </td>
                            </tr>
                        </table>
                        <div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>
                        ${button(quote.authformLink, style.buttonLabel, {
                            background: style.buttonBackground,
                            color: style.buttonColor,
                            fontSize: style.buttonSize,
                            fullWidth: true,
                        })}
                        ${incentiveList(quote.incentives, style.incentives)}
                    </td>
                </tr>
            </table>
        </td>
    </tr>`;
}

function renderPromoLayer(quote: QuoteLayer): string {
    return quoteCard(quote, {
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
        imageHeight: 180,
        buttonLabel: "Reserve this offer",
        buttonBackground: COLORS.blue,
        buttonColor: "#ffffff",
        buttonSize: 16,
        incentives: { background: COLORS.paleBlue, titleColor: COLORS.navy, textColor: COLORS.text },
    });
}

function renderUpgradeLayer(quote: QuoteLayer): string {
    return quoteCard(quote, {
        badge: "Recommended upgrade",
        badgeBackground: COLORS.tealSoft,
        badgeColor: COLORS.teal,
        background: "#ffffff",
        borderColor: COLORS.teal,
        borderWidth: 2,
        titleColor: COLORS.navy,
        textColor: COLORS.text,
        mutedColor: COLORS.muted,
        titleSize: 22,
        priceSize: 28,
        imageHeight: 200,
        buttonLabel: "Reserve the upgrade",
        buttonBackground: COLORS.teal,
        buttonColor: "#ffffff",
        buttonSize: 16,
        incentives: { background: COLORS.tealSoft, titleColor: COLORS.teal, textColor: COLORS.text },
    });
}

function renderHailMaryLayer(quote: QuoteLayer): string {
    return quoteCard(quote, {
        badge: "★ Our best offer",
        badgeBackground: COLORS.gold,
        badgeColor: COLORS.navy,
        background: COLORS.navy,
        borderColor: COLORS.gold,
        borderWidth: 3,
        titleColor: "#ffffff",
        textColor: "#ffffff",
        mutedColor: COLORS.navySoft,
        titleSize: 26,
        priceSize: 34,
        imageHeight: 240,
        buttonLabel: "Reserve the ultimate getaway",
        buttonBackground: COLORS.gold,
        buttonColor: COLORS.navy,
        buttonSize: 18,
        incentives: { background: "#1d3d61", titleColor: COLORS.gold, textColor: "#ffffff" },
    });
}

function footer(agent: Agent): string {
    return `
    <tr>
        <td bgcolor="${COLORS.paleBlue}" style="padding:24px;border-top:1px solid ${COLORS.border};${FONT}font-size:14px;line-height:22px;color:${COLORS.text};" align="center">
            Questions? Reply to this email or call me at
            <strong style="color:${COLORS.navy};">${esc(agent.phone)}</strong>.<br>
            <span style="color:${COLORS.muted};">${esc(agent.name)} · Odenza Vacations · Agent #${esc(agent.agentNum)}</span>
            <p style="margin:16px 0 0;font-size:11px;line-height:16px;color:${COLORS.muted};">
                Prices are in Canadian dollars and subject to availability until reserved.
            </p>
        </td>
    </tr>`;
}

export function renderQuoteEmail(
    data: QuoteEmailData,
    options: { logoSrc: string; heroSrc?: string; baseUrl?: string },
): string {
    const { baseUrl } = options;
    const url = (src: string) => (baseUrl ? new URL(src, baseUrl).href : src);
    const logoSrc = url(options.logoSrc);
    const heroSrc = options.heroSrc && url(options.heroSrc);
    if (baseUrl) data = resolveImages(data, baseUrl);

    return `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background-color:${COLORS.page};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.page}">
            <tr>
                <td align="center" style="padding:24px 0;">
                    <table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:${EMAIL_WIDTH}px;">
                        ${header(data.agent, logoSrc)}
                        ${intro(data.guestName, heroSrc)}
                        ${spacer(24)}
                        ${renderPromoLayer(data.promo)}
                        ${spacer(24)}
                        ${renderUpgradeLayer(data.upgrade)}
                        ${spacer(24)}
                        ${renderHailMaryLayer(data.hailMary)}
                        ${spacer(32)}
                        ${footer(data.agent)}
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}
