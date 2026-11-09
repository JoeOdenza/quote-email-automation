import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listAllIncentiveTypes } from "@/db/queries";
import { primaryButton } from "../ui/form";

async function IncentiveList() {
    await connection();
    const incentives = await listAllIncentiveTypes();
    if (incentives.length === 0) {
        return <p className="p-5 text-sm text-zinc-500">No incentives yet.</p>;
    }

    return (
        <ul className="divide-y divide-zinc-100">
            {incentives.map((incentive) => (
                <li key={incentive.id}>
                    <Link
                        href={`/incentives/${incentive.id}`}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50"
                    >
                        {incentive.srcImg ? (
                            // eslint-disable-next-line @next/next/no-img-element -- uploads and external placeholders, shown as-is
                            <img
                                src={incentive.srcImg}
                                alt=""
                                width={44}
                                height={44}
                                className={`size-11 shrink-0 rounded-full ${incentive.active ? "" : "opacity-50 grayscale"}`}
                            />
                        ) : (
                            <span className="size-11 shrink-0 rounded-full bg-zinc-200" />
                        )}
                        <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className={`font-medium ${incentive.active ? "text-zinc-900" : "text-zinc-500"}`}>
                                    {incentive.title}
                                </span>
                                {incentive.code && (
                                    <code className="font-mono text-[11px] text-zinc-500">{incentive.code}</code>
                                )}
                            </span>
                            {incentive.description && (
                                <span className="block truncate text-xs text-zinc-500">{incentive.description}</span>
                            )}
                        </span>
                        <span className="hidden shrink-0 text-xs text-zinc-500 sm:block">
                            Issued {incentive.issued}×
                        </span>
                        <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                incentive.active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"
                            }`}
                        >
                            {incentive.active ? "Active" : "Retired"}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default function IncentivesPage() {
    return (
        <main className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-[#14304f]">Incentives</h1>
                    <p className="text-sm text-zinc-600">
                        The bonuses agents can add to a quote. Retired ones are kept for past emails.
                    </p>
                </div>
                <Link href="/incentives/new" className={primaryButton}>
                    Add incentive
                </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <Suspense fallback={<p className="p-5 text-sm text-zinc-500">Loading…</p>}>
                    <IncentiveList />
                </Suspense>
            </div>
        </main>
    );
}
