import { renderQuoteEmail } from "@/libs/render";
import { sampleHeroSrc, sampleQuoteEmail } from "@/libs/sample";

export function GET(request: Request) {
    // baseUrl turns image paths into full URLs, so the images still load after
    // you paste the email into Outlook.
    const html = renderQuoteEmail(sampleQuoteEmail, {
        logoSrc: "/OdenzaLogo.png",
        heroSrc: sampleHeroSrc,
        baseUrl: request.url,
    });
    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
