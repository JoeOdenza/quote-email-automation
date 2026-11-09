import { withBasePath } from "@/libs/base-path";
import { primaryButton } from "../../ui/form";

// Public (under /auth), so signing out doesn't bounce straight back to Microsoft.
export default function SignedOutPage() {
    return (
        <main className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-[#14304f]">You&apos;re signed out</h1>
            <p className="text-sm text-zinc-600">
                You&apos;re signed out of this app. Your Microsoft account itself is still signed in on this browser.
            </p>
            <a href={withBasePath("/auth/signin")} className={primaryButton}>
                Sign in with Microsoft
            </a>
        </main>
    );
}
