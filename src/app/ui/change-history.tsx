import Link from "next/link";
import type { changeLog } from "@/db/schema";
import { describeField, parseFields } from "@/libs/change-log";
import { formatDateTime } from "@/libs/format";

type Row = typeof changeLog.$inferSelect;

const actionStyles: Record<Row["action"], string> = {
    created: "bg-green-50 text-green-700",
    edited: "bg-blue-50 text-blue-700",
    retired: "bg-zinc-100 text-zinc-600",
    restored: "bg-green-50 text-green-700",
    deleted: "bg-red-50 text-red-700",
};

// Who changed what, newest first. showItem names (and links) the incentive or
// theme on each row, for the Activity page; an item's own page leaves it out.
export function ChangeHistory({ rows, showItem = false }: { rows: Row[]; showItem?: boolean }) {
    if (rows.length === 0) return <p className="p-5 text-sm text-zinc-500">No changes recorded yet.</p>;

    const deleted = new Set(rows.filter((r) => r.action === "deleted").map((r) => `${r.entityType}:${r.entityId}`));

    return (
        <ul className="divide-y divide-zinc-100">
            {rows.map((row) => {
                const fields = parseFields(row.details);
                const href = `/${row.entityType === "incentive" ? "incentives" : "themes"}/${row.entityId}`;
                return (
                    <li key={row.id} className="flex flex-col gap-1 px-5 py-3 text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionStyles[row.action]}`}>
                                {row.action[0].toUpperCase() + row.action.slice(1)}
                            </span>
                            {showItem && (
                                <span className="text-zinc-900">
                                    <span className="text-zinc-500">{row.entityType === "incentive" ? "Incentive" : "Theme"} </span>
                                    {deleted.has(`${row.entityType}:${row.entityId}`) ? (
                                        <span className="font-medium">{row.entityName}</span>
                                    ) : (
                                        <Link href={href} className="font-medium text-[#14304f] hover:underline">
                                            {row.entityName}
                                        </Link>
                                    )}
                                </span>
                            )}
                            <span className="text-zinc-700">
                                by <span className="font-medium" title={row.accountEmail}>{row.accountName}</span>
                            </span>
                            <span className="ml-auto text-xs text-zinc-500">{formatDateTime(row.createdAt)}</span>
                        </div>
                        {fields.length > 0 && (
                            <ul className="list-disc pl-5 text-xs text-zinc-600">
                                {fields.map((field, i) => (
                                    <li key={i} className="break-words">
                                        {describeField(field)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

// The history box shown under an incentive's or theme's edit form.
export function ChangeHistorySection({ rows }: { rows: Row[] }) {
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <h2 className="border-b border-zinc-200 px-5 py-3 text-sm font-semibold text-[#14304f]">History</h2>
            <ChangeHistory rows={rows} />
        </section>
    );
}
