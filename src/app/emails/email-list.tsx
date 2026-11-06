"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export type EmailListItem = { id: number; guestName: string; guestProfileNum: string; created: string };

export function EmailList({ emails }: { emails: EmailListItem[] }) {
    const params = useParams<{ id?: string }>();

    if (emails.length === 0) {
        return (
            <p className="p-4 text-sm text-zinc-500">
                No emails yet.{" "}
                <Link href="/" className="font-medium text-[#0045a5] underline">
                    Create one
                </Link>
                .
            </p>
        );
    }

    return (
        <ul className="divide-y divide-zinc-100">
            {emails.map((e) => (
                <li key={e.id}>
                    <Link
                        href={`/emails/${e.id}`}
                        aria-current={params.id === String(e.id) ? "page" : undefined}
                        className="block px-4 py-3 hover:bg-zinc-50 aria-[current=page]:bg-[#f4f7fb] aria-[current=page]:shadow-[inset_3px_0_0_#0045a5]"
                    >
                        <span className="block truncate text-sm font-medium text-zinc-900">{e.guestName}</span>
                        <span className="block text-xs text-zinc-500">
                            #{e.guestProfileNum} · {e.created}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
