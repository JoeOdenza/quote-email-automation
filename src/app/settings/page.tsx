import { connection } from "next/server";
import { Suspense } from "react";
import { getAgent } from "@/db/queries";
import { AgentForm } from "./agent-form";

async function AgentFormLoader() {
    await connection();
    const agent = await getAgent();
    return (
        <AgentForm
            agent={
                agent && {
                    name: agent.name,
                    agentNum: agent.agentNum,
                    email: agent.email,
                    phone: agent.phone,
                    schedule: agent.schedule ?? "",
                }
            }
        />
    );
}

export default function SettingsPage() {
    return (
        <main className="flex flex-col gap-5">
            <h1 className="text-2xl font-semibold text-[#14304f]">Settings</h1>
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <AgentFormLoader />
            </Suspense>
        </main>
    );
}
