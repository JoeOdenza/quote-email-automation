import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { agent, microsoftAccount } from "@/db/schema";

// Agent details saved before each person had their own have no owner. They,
// and the emails made with them, go to whoever they belong to:
//   - at sign-in, to the account whose Microsoft email matches the agent email;
//   - on saving Settings, to the person who saves that same agent number.

// Called right after a successful Microsoft sign-in, before the session starts.
export async function claimAgentByEmail(accountId: string): Promise<void> {
    const [owned] = await db.select({ id: agent.id }).from(agent).where(eq(agent.accountId, accountId));
    if (owned) return;
    const [account] = await db
        .select({ email: microsoftAccount.email })
        .from(microsoftAccount)
        .where(eq(microsoftAccount.id, accountId));
    if (!account) return;
    const [unowned] = await db
        .select({ id: agent.id })
        .from(agent)
        .where(and(isNull(agent.accountId), sql`lower(${agent.email}) = ${account.email.toLowerCase()}`))
        .limit(1);
    if (unowned) await db.update(agent).set({ accountId }).where(eq(agent.id, unowned.id));
}

// The unowned agent details with this agent number, if any, so saving
// Settings with it takes them over instead of failing as a duplicate.
export async function unownedAgentWithNumber(agentNum: string): Promise<number | null> {
    const [row] = await db
        .select({ id: agent.id })
        .from(agent)
        .where(and(isNull(agent.accountId), eq(agent.agentNum, agentNum)));
    return row?.id ?? null;
}
