import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { microsoftAccount, session } from "@/db/schema";
import { isAllowed } from "./access";
import { randomToken, sha256 } from "./crypto";
import { appUrl } from "./microsoft";

export const SESSION_COOKIE = "qe_session";
const LIFETIME_DAYS = 30;

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax" as const,
    secure: appUrl().startsWith("https://"),
    path: "/",
});

// Call from a Route Handler or Server Action (cookies can't be set while rendering).
export async function startSession(accountId: string): Promise<void> {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + LIFETIME_DAYS * 24 * 60 * 60 * 1000);
    await db.insert(session).values({ tokenHash: sha256(token), accountId, expiresAt });
    (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
}

export async function endSession(): Promise<void> {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) await db.delete(session).where(eq(session.tokenHash, sha256(token)));
    store.delete(SESSION_COOKIE);
}

// The signed-in Microsoft account, or null. Safe to call while rendering.
export async function currentAccount() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [row] = await db
        .select({ id: microsoftAccount.id, email: microsoftAccount.email, name: microsoftAccount.name })
        .from(session)
        .innerJoin(microsoftAccount, eq(session.accountId, microsoftAccount.id))
        // Expiry is compared in SQLite, not with new Date(), so rendering
        // never reads the clock (which Next.js won't allow while prerendering).
        .where(and(eq(session.tokenHash, sha256(token)), sql`${session.expiresAt} > unixepoch()`));
    // Re-checked on every request, so removing someone from ALLOWED_EMAILS
    // locks them out straight away.
    return row && isAllowed(row.email) ? row : null;
}

// The signed-in account, or a redirect to Microsoft sign-in. Every database
// query and server action calls this: proxy.ts only checks that a cookie
// exists, so this is the check that actually protects the data.
export async function requireAccount(returnTo = "/") {
    const account = await currentAccount();
    if (!account) redirect(`/auth/signin?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
    return account;
}

// Where to go after sign-in. Only paths on this site, so the sign-in link
// can't be used to bounce people to another website.
export function safeReturnTo(value: string | null | undefined): string {
    return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}
