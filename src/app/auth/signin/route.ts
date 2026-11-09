import { redirect } from "next/navigation";
import { randomToken } from "@/libs/crypto";
import { authorizeUrl } from "@/libs/microsoft";
import { savePendingSignIn } from "@/libs/oauth-state";
import { safeReturnTo } from "@/libs/session";

// /auth/signin?returnTo=/emails/3 sends the browser to Microsoft's sign-in page.
export async function GET(request: Request) {
    const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));
    const state = randomToken(16);
    const codeVerifier = randomToken(48);
    await savePendingSignIn({ state, codeVerifier, returnTo });
    redirect(authorizeUrl(state, codeVerifier));
}
