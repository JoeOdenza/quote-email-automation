// Rules for the incentive catalog, shared by the editor form and the server.

export const ICON_SIZE = 176; // shown at 44 × 44 in the email; stored at 4× for sharp screens
export const iconImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const iconMaxBytes = 2 * 1024 * 1024;

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
export const CODE_MAX = 20;

// Used when no icon is uploaded: a gold circle with the title's first word,
// e.g. "$150" for "$150 future travel credit".
export function placeholderIcon(title: string): string {
    const word = title.trim().split(/\s+/)[0]?.slice(0, 5) || "★";
    return `https://placehold.co/88x88/e0b13a/14304f/png?font=roboto&text=${encodeURIComponent(word)}`;
}
