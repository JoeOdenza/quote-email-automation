import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomToken } from "@/libs/crypto";
import { authorizeUrl } from "@/libs/microsoft";
import { savePendingSignIn } from "@/libs/oauth-state";
import { SESSION_COOKIE, safeReturnTo } from "@/libs/session";

// /auth/signin?returnTo=/emails/3 sends the browser to Microsoft's sign-in page.
export async function GET(request: Request) {
    const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));
    const state = randomToken(16);
    const codeVerifier = randomToken(48);
    // Before the app moved under BASE_PATH, the session cookie was saved at
    // "/". A leftover one is sent after the current one and wins, so the
    // new session is never seen and sign-in loops. Expire it here; this
    // response doesn't set the current session cookie, so it can't clash.
    (await cookies()).delete({ name: SESSION_COOKIE, path: "/" });
    await savePendingSignIn({ state, codeVerifier, returnTo });
    redirect(authorizeUrl(state, codeVerifier));
}
