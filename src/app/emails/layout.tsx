import { connection } from "next/server";
import { Suspense } from "react";
import { listEmails } from "@/db/queries";
import { formatDateTime } from "@/libs/format";
import { EmailList } from "./email-list";

async function EmailListLoader() {
    await connection();
    const emails = await listEmails();
    return (
        <EmailList
            emails={emails.map((e) => ({
                id: e.id,
                guestName: e.guestName,
                guestProfileNum: e.guestProfileNum,
                created: formatDateTime(e.createdAt),
            }))}
        />
    );
}

export default function EmailsLayout({ children }: LayoutProps<"/emails">) {
    return (
        <main className="grid flex-1 gap-5 md:grid-cols-[18rem_1fr]">
            <aside className="self-start overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm md:sticky md:top-6">
                <h1 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-[#14304f]">Past emails</h1>
                <div className="max-h-[70vh] overflow-y-auto">
                    <Suspense fallback={<p className="p-4 text-sm text-zinc-500">Loading…</p>}>
                        <EmailListLoader />
                    </Suspense>
                </div>
            </aside>
            <section className="min-w-0">{children}</section>
        </main>
    );
}
