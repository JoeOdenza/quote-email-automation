// Preset colour schemes for email themes. A theme (made on the Themes page)
// pairs one of these with its four pictures. The layout is the same for every
// scheme; only the colours change. No imports, so the browser can use it too.

export type Palette = {
    // Header band, headings, the premium card's border and button.
    dark: string;
    // Secondary text on the dark header.
    darkSoft: string;
    // The base card's button and badge text.
    accent: string;
    // Light tint: the base card's badge and incentives, and the footer.
    accentSoft: string;
    // The upgrade card's background (white text sits on it).
    feature: string;
    // The upgrade card's price panel and incentives.
    featureDark: string;
    // Secondary text on the upgrade card.
    featureMuted: string;
    // The upgrade card's badge.
    featureBadgeBg: string;
    featureBadgeText: string;
    // The upgrade card's border, ribbon and button (dark text sits on it).
    highlight: string;
    // The premium card's badge and incentives.
    premiumSoft: string;
    premiumBadgeText: string;
};

export const colorSchemes = [
    {
        id: "cruises",
        name: "Cruises",
        // Deep ocean blues with a brass-gold highlight.
        palette: {
            dark: "#0f2a4a",
            darkSoft: "#c5d4e8",
            accent: "#0b5fa5",
            accentSoft: "#f1f6fc",
            feature: "#0d3b66",
            featureDark: "#092c4d",
            featureMuted: "#b8cde3",
            featureBadgeBg: "#e3eef9",
            featureBadgeText: "#0b5fa5",
            highlight: "#f2c14e",
            premiumSoft: "#fdf6e3",
            premiumBadgeText: "#8a6a12",
        },
    },
    {
        id: "mountain-resort",
        name: "Mountain Resort",
        // Slate and pine green with an amber, firelit highlight.
        palette: {
            dark: "#22313f",
            darkSoft: "#cdd6df",
            accent: "#2e6b4f",
            accentSoft: "#f2f6f3",
            feature: "#2b4a3a",
            featureDark: "#1f382b",
            featureMuted: "#c3d8cb",
            featureBadgeBg: "#e7f1ea",
            featureBadgeText: "#2e6b4f",
            highlight: "#d9a441",
            premiumSoft: "#faf3e6",
            premiumBadgeText: "#85601a",
        },
    },
    {
        id: "natural-resort",
        name: "Natural Resort",
        // Earthy brown and moss green with a warm wheat highlight.
        palette: {
            dark: "#3b2f25",
            darkSoft: "#e0d4c6",
            accent: "#5a7d3a",
            accentSoft: "#f5f7ef",
            feature: "#4f6b34",
            featureDark: "#3d5428",
            featureMuted: "#d3dfc4",
            featureBadgeBg: "#eef3e6",
            featureBadgeText: "#4f6b34",
            highlight: "#e3b25d",
            premiumSoft: "#faf4e8",
            premiumBadgeText: "#7f5d1d",
        },
    },
    {
        id: "tropical-resort",
        name: "Tropical Resort",
        // Lagoon teal and turquoise with a mango-coral highlight.
        palette: {
            dark: "#0f3d3e",
            darkSoft: "#c3e0de",
            accent: "#0a7c7e",
            accentSoft: "#effaf9",
            feature: "#0b5e61",
            featureDark: "#08494c",
            featureMuted: "#bfe3e1",
            featureBadgeBg: "#e2f5f3",
            featureBadgeText: "#0a7c7e",
            highlight: "#ff9f5a",
            premiumSoft: "#fff3ea",
            premiumBadgeText: "#a14d14",
        },
    },
    {
        id: "airline",
        name: "Airline",
        // Charcoal and airline blue, a crimson upgrade card and champagne gold.
        palette: {
            dark: "#1b2433",
            darkSoft: "#c9d1de",
            accent: "#1d4e89",
            accentSoft: "#f3f6fa",
            feature: "#9e1b24",
            featureDark: "#7c141c",
            featureMuted: "#f2c6c9",
            featureBadgeBg: "#fbe8e9",
            featureBadgeText: "#9e1b24",
            highlight: "#e9c46a",
            premiumSoft: "#fbf6e9",
            premiumBadgeText: "#85631b",
        },
    },
    {
        id: "tours",
        name: "Tours",
        // Espresso and terracotta with a saffron highlight.
        palette: {
            dark: "#2f2a24",
            darkSoft: "#ddd2c4",
            accent: "#b5532c",
            accentSoft: "#fbf4ef",
            feature: "#7a3b23",
            featureDark: "#5f2d1a",
            featureMuted: "#f0cdb9",
            featureBadgeBg: "#f8e6dc",
            featureBadgeText: "#a8481f",
            highlight: "#f0b84a",
            premiumSoft: "#fcf5e6",
            premiumBadgeText: "#8a5f10",
        },
    },
    {
        id: "city-resort",
        name: "City Resort",
        // Graphite and deep berry (city nights) with a streetlight-amber highlight.
        palette: {
            dark: "#232129",
            darkSoft: "#d9d3dc",
            accent: "#a62d67",
            accentSoft: "#fbf2f6",
            feature: "#4f1d3d",
            featureDark: "#3c1530",
            featureMuted: "#ecc7da",
            featureBadgeBg: "#f8e4ee",
            featureBadgeText: "#8f2558",
            highlight: "#f4b860",
            premiumSoft: "#fdf5e8",
            premiumBadgeText: "#8a5a12",
        },
    },
    {
        id: "arctic-resort",
        name: "Arctic Resort",
        // Polar night and glacier blue with an aurora-green highlight.
        palette: {
            dark: "#1c2e3d",
            darkSoft: "#cddbe6",
            accent: "#2f7fa8",
            accentSoft: "#f2f7fb",
            feature: "#24506b",
            featureDark: "#1a3c52",
            featureMuted: "#c6dceb",
            featureBadgeBg: "#e3f0f8",
            featureBadgeText: "#2f7fa8",
            highlight: "#7ddfb5",
            premiumSoft: "#eefaf5",
            premiumBadgeText: "#1f7a55",
        },
    },
    {
        id: "desert-resort",
        name: "Desert Resort",
        // Dusk indigo and ochre with a sand-gold highlight.
        palette: {
            dark: "#2a2438",
            darkSoft: "#d9d2e3",
            accent: "#b06a2c",
            accentSoft: "#fbf5ee",
            feature: "#3b3561",
            featureDark: "#2d284c",
            featureMuted: "#d2cde6",
            featureBadgeBg: "#f6ede2",
            featureBadgeText: "#8e5520",
            highlight: "#e8b96a",
            premiumSoft: "#fbf3e4",
            premiumBadgeText: "#85581a",
        },
    },
] as const satisfies readonly { id: string; name: string; palette: Palette }[];

export type ColorSchemeId = (typeof colorSchemes)[number]["id"];
export type ColorScheme = (typeof colorSchemes)[number];

export const DEFAULT_COLOR_SCHEME: ColorSchemeId = "mountain-resort";

export function getColorScheme(id: string): ColorScheme | undefined {
    return colorSchemes.find((scheme) => scheme.id === id);
}

// The five colours shown as a swatch strip when picking a scheme.
export function swatchColors(palette: Palette): string[] {
    return [palette.dark, palette.accent, palette.feature, palette.highlight, palette.accentSoft];
}
