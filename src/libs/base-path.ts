// The app is served under this path (e.g. https://mailing.odenzamarketing.com
// /travel/quote), next to other apps on the same domain. next.config.ts reads
// it, so Next.js prefixes links, redirects and its own files automatically.
//
// Anything written by hand still needs the prefix: plain <a href>, <img src>,
// cookie paths, and image paths that go into emails. Those use withBasePath().
// Paths saved in the database ("/uploads/<id>") are kept without the prefix.
export const BASE_PATH = "/travel/quote";

// Adds BASE_PATH to a site path ("/images/hero.jpg"). Full URLs, data: URLs
// and paths that already have the prefix are returned unchanged.
export function withBasePath(src: string): string {
    if (!src.startsWith("/") || src.startsWith("//")) return src;
    if (src === BASE_PATH || src.startsWith(BASE_PATH + "/")) return src;
    return BASE_PATH + src;
}

// The reverse of withBasePath, for reading a URL's path ("/travel/quote/
// uploads/x" → "/uploads/x"). Older emails without the prefix pass through.
export function stripBasePath(pathname: string): string {
    if (pathname === BASE_PATH) return "/";
    return pathname.startsWith(BASE_PATH + "/") ? pathname.slice(BASE_PATH.length) : pathname;
}
