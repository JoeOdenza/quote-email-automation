import { connection } from "next/server";
import { Suspense } from "react";
import { listChanges } from "@/db/queries";
import { ChangeHistory } from "../ui/change-history";

async function ActivityList() {
    await connection();
    return <ChangeHistory rows={await listChanges()} showItem />;
}

export default function ActivityPage() {
    return (
        <main className="flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-semibold text-[#14304f]">Activity</h1>
                <p className="text-sm text-zinc-600">Who changed which incentives and themes. The latest 200 changes.</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <Suspense fallback={<p className="p-5 text-sm text-zinc-500">Loading…</p>}>
                    <ActivityList />
                </Suspense>
            </div>
        </main>
    );
}
