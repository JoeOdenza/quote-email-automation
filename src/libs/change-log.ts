import "server-only";
import { db } from "@/db";
import { changeLog } from "@/db/schema";

// Records who changed an incentive or theme. Each change is written to the
// change_log table (the lasting record, shown in the app) and printed as one
// "[change] ..." line on stdout, so it also shows up in the server's logs,
// e.g. `journalctl -u <service> | grep '\[change\]'`.

export type ChangeAction = (typeof changeLog.$inferInsert)["action"];
export type ChangeEntityType = (typeof changeLog.$inferInsert)["entityType"];

// One changed field. A picture has no from/to: it was replaced.
export type FieldChange = { field: string; from?: string | null; to?: string | null };

export type Change = {
    entityType: ChangeEntityType;
    entityId: string | number;
    entityName: string;
    action: ChangeAction;
    fields?: FieldChange[];
};

type Account = { id: string; name: string; email: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// The fields whose values differ between before and after, by label.
export function diffFields(
    labels: Record<string, string>,
    before: Record<string, string | null>,
    after: Record<string, string | null>,
): FieldChange[] {
    return Object.entries(labels)
        .filter(([key]) => (before[key] ?? null) !== (after[key] ?? null))
        .map(([key, field]) => ({ field, from: before[key] ?? null, to: after[key] ?? null }));
}

// Writes the change inside the caller's transaction, so a change is never
// saved without its log row. Call printChange after the transaction commits.
export async function recordChange(tx: Tx, account: Account, change: Change): Promise<void> {
    await tx.insert(changeLog).values({
        accountId: account.id,
        accountName: account.name,
        accountEmail: account.email,
        entityType: change.entityType,
        entityId: String(change.entityId),
        entityName: change.entityName,
        action: change.action,
        details: change.fields?.length ? JSON.stringify(change.fields) : null,
    });
}

export function printChange(account: Account, change: Change): void {
    const what = `${change.action} ${change.entityType} "${change.entityName}" (${change.entityId})`;
    const fields = change.fields?.length ? `: ${change.fields.map(describeField).join("; ")}` : "";
    console.info(`[change] ${account.name} <${account.email}> ${what}${fields}`);
}

export function describeField(change: FieldChange): string {
    if (change.from === undefined && change.to === undefined) return `${change.field} replaced`;
    return `${change.field} ${quote(change.from)} → ${quote(change.to)}`;
}

const quote = (value: string | null | undefined) => {
    if (!value) return "(empty)";
    const oneLine = value.replace(/\s+/g, " ");
    return `"${oneLine.length > 80 ? `${oneLine.slice(0, 79)}…` : oneLine}"`;
};

export function parseFields(details: string | null): FieldChange[] {
    if (!details) return [];
    try {
        const parsed = JSON.parse(details);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
