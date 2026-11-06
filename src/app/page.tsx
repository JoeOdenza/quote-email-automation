import { connection } from "next/server";
import { Suspense } from "react";
import { getAgent, listIncentiveTypes } from "@/db/queries";
import { QuoteForm } from "./quote-form";

async function QuoteFormLoader() {
    await connection(); // read the database per request, never at build time
    const [incentives, agent] = await Promise.all([listIncentiveTypes(), getAgent()]);
    return (
        <QuoteForm
            incentives={incentives.map(({ id, title, description }) => ({ id, title, description }))}
            hasAgent={agent !== null}
        />
    );
}

export default function Home() {
    return (
        <main className="flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-semibold text-[#14304f]">New quote email</h1>
                <p className="text-sm text-zinc-600">Enter the guest and the three quotes, then preview the email.</p>
            </div>
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <QuoteFormLoader />
            </Suspense>
        </main>
    );
}
