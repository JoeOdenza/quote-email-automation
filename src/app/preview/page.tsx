import { renderQuoteEmail } from "@/libs/render";
import { sampleHeroSrc, sampleQuoteEmail } from "@/libs/sample";

export default function PreviewPage() {
    const html = renderQuoteEmail(sampleQuoteEmail, { logoSrc: "/OdenzaLogo.png", heroSrc: sampleHeroSrc });
    return (
        <main className="p-6">
            <iframe srcDoc={html} title="Email preview" className="h-[90vh] w-full border" />
        </main>
    );
}
