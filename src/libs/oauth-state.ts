import "server-only";
import { cookies } from "next/headers";
import { BASE_PATH } from "./base-path";
import { decrypt, encrypt } from "./crypto";
import { appUrl } from "./microsoft";

// Remembers a sign-in attempt between leaving for Microsoft and coming back:
// the state (to reject forged callbacks), the PKCE verifier, and where to
// return to. Kept in a short-lived, encrypted cookie.

const COOKIE = "qe_oauth";
const COOKIE_PATH = `${BASE_PATH}/auth`;

type PendingSignIn = { state: string; codeVerifier: string; returnTo: string };

export async function savePendingSignIn(pending: PendingSignIn): Promise<void> {
    (await cookies()).set(COOKIE, encrypt(JSON.stringify(pending)), {
        httpOnly: true,
        sameSite: "lax", // sent on the top-level redirect back from Microsoft
        secure: appUrl().startsWith("https://"),
        path: COOKIE_PATH,
        maxAge: 10 * 60,
    });
}

export async function takePendingSignIn(): Promise<PendingSignIn | null> {
    const store = await cookies();
    const value = store.get(COOKIE)?.value;
    store.delete({ name: COOKIE, path: COOKIE_PATH });
    const json = value && decrypt(value);
    return json ? (JSON.parse(json) as PendingSignIn) : null;
}
