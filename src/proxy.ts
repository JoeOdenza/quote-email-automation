import { NextResponse, type NextRequest } from "next/server";

// First line of defence: anyone without a session cookie is sent to Microsoft
// sign-in before any page loads. This only checks that the cookie exists;
// requireAccount() in the queries and actions checks that it's valid.
//
// Left public on purpose (see the matcher):
//   /auth/*        signing in and out
//   /uploads/*     banner and icon images in sent emails
//   /images/*, /OdenzaLogo.png, /favicon.ico   images in sent emails
//   /_next/*       the app's own scripts and styles

const SESSION_COOKIE = "qe_session"; // same name as in libs/session.ts

export function proxy(request: NextRequest) {
    if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

    // A page visit: go sign in, then come back here.
    if (request.method === "GET" || request.method === "HEAD") {
        // nextUrl paths leave out the base path, and add it back when the
        // URL is written out, so both of these stay inside the app.
        const { pathname, search } = request.nextUrl;
        const url = request.nextUrl.clone();
        url.pathname = "/auth/signin";
        url.search = "";
        url.searchParams.set("returnTo", pathname + search);
        return NextResponse.redirect(url);
    }
    // Anything else (e.g. a form post) can't follow a sign-in redirect.
    return new NextResponse("Sign in required", { status: 401 });
}

export const config = {
    // Matchers are relative to the base path. The home page ("/travel/quote")
    // needs its own entry: with a base path the pattern below only matches
    // URLs with something after "/travel/quote/".
    matcher: ["/", "/((?!auth/|uploads/|images/|_next/|OdenzaLogo\\.png$|favicon\\.ico$).*)"],
};
