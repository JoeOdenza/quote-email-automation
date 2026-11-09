import { redirect } from "next/navigation";
import { completeSignIn, NotAllowedError } from "@/libs/microsoft";
import { takePendingSignIn } from "@/libs/oauth-state";
import { startSession } from "@/libs/session";

// Microsoft sends the browser back here after sign-in. This path must match
// the redirect URI in the Entra app registration.

function errorPage(message: string, status = 400) {
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    return new Response(
        `<!DOCTYPE html><meta charset="utf-8"><title>Sign-in failed</title>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#27272a">
<h1 style="font-size:1.25rem;color:#14304f">Microsoft sign-in didn't complete</h1>
<p>${esc(message)}</p>
<p><a href="/auth/signin" style="color:#0045a5">Try again</a> · <a href="/" style="color:#0045a5">Back to the app</a></p>`,
        { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
}

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const pending = await takePendingSignIn();

    // e.g. the person cancelled, or an admin hasn't approved the app.
    const error = params.get("error");
    if (error) {
        console.warn("Microsoft sign-in error:", error, params.get("error_description"));
        return errorPage(
            error === "access_denied"
                ? "Sign-in was cancelled, or the permissions weren't accepted."
                : `Microsoft returned an error: ${params.get("error_description") ?? error}`,
        );
    }

    const code = params.get("code");
    if (!pending || !code || params.get("state") !== pending.state) {
        return errorPage("The sign-in link expired or didn't match. Start the sign-in again.");
    }

    let accountId: string;
    try {
        accountId = await completeSignIn(code, pending.codeVerifier);
    } catch (err) {
        if (err instanceof NotAllowedError) {
            console.warn("Sign-in refused, not in ALLOWED_EMAILS:", err.message);
            return errorPage(
                `${err.message} isn't allowed to use this app. Ask an administrator to add it, or sign in with a different account.`,
                403,
            );
        }
        console.error("Microsoft sign-in failed:", err);
        return errorPage("Signing in with Microsoft failed. Check the server log for details.", 502);
    }

    await startSession(accountId);
    redirect(pending.returnTo);
}
