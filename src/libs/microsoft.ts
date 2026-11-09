import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { microsoftAccount } from "@/db/schema";
import { isAllowed } from "./access";
import { decrypt, encrypt, sha256 } from "./crypto";
import type { InlineImage } from "./inline-images";

// Microsoft sign-in (OAuth 2.0 authorization code flow with PKCE) and the
// Microsoft Graph calls the app makes. Settings come from .env.local:
//   MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT, APP_URL
// MICROSOFT_TENANT is "consumers" (personal accounts), "common" (work and
// personal), or a directory (tenant) ID to allow only that organization.

// Delegated permissions: the app only ever acts as the signed-in person.
const SCOPES = ["openid", "profile", "offline_access", "User.Read", "Mail.ReadWrite"];
const GRAPH = "https://graph.microsoft.com/v1.0";

function env(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} must be set in .env.local.`);
    return value;
}

export function appUrl(): string {
    return env("APP_URL").replace(/\/+$/, "");
}

// Must match the redirect URI in the Entra app registration exactly.
export const redirectUri = () => `${appUrl()}/auth/callback`;

const authority = () => `https://login.microsoftonline.com/${encodeURIComponent(env("MICROSOFT_TENANT"))}/oauth2/v2.0`;

// PKCE: the verifier stays with us (in a cookie); Microsoft only sees its hash.
export function authorizeUrl(state: string, codeVerifier: string): string {
    const params = new URLSearchParams({
        client_id: env("MICROSOFT_CLIENT_ID"),
        response_type: "code",
        redirect_uri: redirectUri(),
        response_mode: "query",
        scope: SCOPES.join(" "),
        state,
        code_challenge: sha256(codeVerifier),
        code_challenge_method: "S256",
        prompt: "select_account",
    });
    return `${authority()}/authorize?${params}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

export class MicrosoftAuthError extends Error {}

async function requestToken(params: Record<string, string>): Promise<TokenResponse> {
    const response = await fetch(`${authority()}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env("MICROSOFT_CLIENT_ID"),
            client_secret: env("MICROSOFT_CLIENT_SECRET"),
            scope: SCOPES.join(" "),
            ...params,
        }),
        cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        // e.g. invalid_grant (expired or revoked), invalid_client (bad secret)
        throw new MicrosoftAuthError(`${body.error ?? response.status}: ${body.error_description ?? "token request failed"}`);
    }
    return body as TokenResponse;
}

const expiresAt = (seconds: number) => new Date(Date.now() + seconds * 1000);

export class NotAllowedError extends Error {}

// Finishes sign-in: trades the code from the callback for tokens, looks up
// who signed in, and saves (or updates) their account. Returns the account id.
// Throws NotAllowedError, without saving anything, if the account isn't
// allowed to use the app (see libs/access.ts).
export async function completeSignIn(code: string, codeVerifier: string): Promise<string> {
    const tokens = await requestToken({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(),
        code_verifier: codeVerifier,
    });
    if (!tokens.refresh_token) throw new MicrosoftAuthError("No refresh token returned (is offline_access granted?)");

    const me = await graphRequest<{ id: string; displayName: string | null; mail: string | null; userPrincipalName: string }>(
        tokens.access_token,
        "/me?$select=id,displayName,mail,userPrincipalName",
    );
    const email = me.mail ?? me.userPrincipalName;
    if (!isAllowed(email)) throw new NotAllowedError(email);
    const fields = {
        email,
        name: me.displayName || email,
        accessToken: encrypt(tokens.access_token),
        accessTokenExpiresAt: expiresAt(tokens.expires_in),
        refreshToken: encrypt(tokens.refresh_token),
    };
    await db
        .insert(microsoftAccount)
        .values({ id: me.id, ...fields })
        .onConflictDoUpdate({ target: microsoftAccount.id, set: fields });
    return me.id;
}

// A usable access token for the account, refreshed if it's about to expire.
// Throws MicrosoftAuthError if the person needs to sign in again.
export async function accessTokenFor(accountId: string): Promise<string> {
    const [account] = await db.select().from(microsoftAccount).where(eq(microsoftAccount.id, accountId));
    if (!account) throw new MicrosoftAuthError("Account not found");

    const current = decrypt(account.accessToken);
    if (current && account.accessTokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) return current;

    const refreshToken = decrypt(account.refreshToken);
    if (!refreshToken) throw new MicrosoftAuthError("Stored refresh token can't be read (was SESSION_SECRET changed?)");
    const tokens = await requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
    await db
        .update(microsoftAccount)
        .set({
            accessToken: encrypt(tokens.access_token),
            accessTokenExpiresAt: expiresAt(tokens.expires_in),
            // Microsoft usually rotates the refresh token; keep the newest.
            ...(tokens.refresh_token && { refreshToken: encrypt(tokens.refresh_token) }),
        })
        .where(eq(microsoftAccount.id, accountId));
    return tokens.access_token;
}

async function graphRequest<T>(accessToken: string, path: string, init?: { method: string; body: unknown }): Promise<T> {
    const response = await fetch(`${GRAPH}${path}`, {
        method: init?.method ?? "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(init && { "Content-Type": "application/json" }),
        },
        body: init && JSON.stringify(init.body),
        cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) throw new MicrosoftAuthError("Microsoft rejected the access token");
    if (!response.ok) {
        throw new Error(`Microsoft Graph ${response.status}: ${body?.error?.code ?? ""} ${body?.error?.message ?? ""}`.trim());
    }
    return body as T;
}

// Saves the email as a draft in the signed-in person's Outlook Drafts folder.
// Nothing is sent; they review and send it from Outlook. Images are attached
// inline: the HTML refers to each one as "cid:<contentId>".
export async function createDraft(
    accountId: string,
    draft: { subject: string; html: string; to: { address: string; name: string }; images: InlineImage[] },
): Promise<{ id: string; webLink: string }> {
    const token = await accessTokenFor(accountId);
    return graphRequest(token, "/me/messages", {
        method: "POST",
        body: {
            subject: draft.subject,
            body: { contentType: "HTML", content: draft.html },
            toRecipients: [{ emailAddress: draft.to }],
            attachments: draft.images.map((image) => ({
                "@odata.type": "#microsoft.graph.fileAttachment",
                name: image.name,
                contentType: image.contentType,
                contentId: image.contentId,
                isInline: true,
                contentBytes: image.bytes.toString("base64"),
            })),
        },
    });
}
