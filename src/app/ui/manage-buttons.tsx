"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

// Retire / unretire and delete controls for the theme and incentive editors.
// Both act straight away, separately from "Save changes".

const secondaryButton =
    "whitespace-nowrap rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60";

// Retires the item (it stops being offered on new quotes) or brings it back.
// Sits beside "Save changes"; a retired item also shows <RetiredNotice>.
export function RetireButton({ active, onChange }: { active: boolean; onChange: (active: boolean) => Promise<void> }) {
    const [pending, startTransition] = useTransition();
    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => onChange(!active))}
            className={secondaryButton}
        >
            {pending ? "Updating…" : active ? "Retire" : "Unretire"}
        </button>
    );
}

export function RetiredNotice({ children }: { children: ReactNode }) {
    return (
        <p className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
            <span className="mr-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">Retired</span>
            {children}
        </p>
    );
}

// A delete button that first asks, in a popup, whether to delete for good.
// With `blockedReason` set, the button is disabled and the reason shown.
export function DeleteControl({
    itemName,
    warning,
    blockedReason,
    onDelete,
}: {
    itemName: string;
    warning: string;
    blockedReason?: string;
    onDelete: () => Promise<{ error?: string } | void>;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string>();

    function confirmDelete() {
        setError(undefined);
        startTransition(async () => {
            // On success the action moves on to the list page.
            const result = await onDelete();
            if (result?.error) setError(result.error);
        });
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                disabled={Boolean(blockedReason)}
                onClick={() => dialogRef.current?.showModal()}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
            >
                Delete
            </button>
            {blockedReason && <p className="max-w-xs text-right text-xs text-zinc-500">{blockedReason}</p>}

            <dialog
                ref={dialogRef}
                aria-labelledby="delete-title"
                className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg border border-zinc-200 p-0 shadow-xl backdrop:bg-black/40"
            >
                <div className="flex flex-col gap-3 p-5">
                    <h2 id="delete-title" className="text-base font-semibold text-zinc-900">
                        Permanently delete “{itemName}”?
                    </h2>
                    <p className="text-sm text-zinc-600">{warning}</p>
                    <p className="text-sm font-medium text-red-700">This can&apos;t be undone.</p>
                    {error && (
                        <p
                            role="alert"
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}
                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            autoFocus
                            disabled={pending}
                            onClick={() => dialogRef.current?.close()}
                            className={secondaryButton}
                        >
                            No, keep it
                        </button>
                        <button
                            type="button"
                            disabled={pending}
                            onClick={confirmDelete}
                            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-60"
                        >
                            {pending ? "Deleting…" : "Yes, delete"}
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
