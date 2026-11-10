"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
    summary: string;
    children: ReactNode;
    // Name of a text field inside whose value is shown next to the summary,
    // so a closed section still says what's in it (e.g. the hotel's name).
    previewField?: string;
    defaultOpen?: boolean;
};

// A section that opens and closes. The fields stay in the form while it's
// closed, and it opens itself when one of them fails validation on submit,
// since the browser can't point at a field it can't show.
export function Accordion({ summary, children, previewField, defaultOpen = true }: Props) {
    const details = useRef<HTMLDetailsElement>(null);
    const [open, setOpen] = useState(defaultOpen);
    const [preview, setPreview] = useState("");

    useEffect(() => {
        const el = details.current;
        if (!el) return;
        const readPreview = () => {
            const field = previewField && el.querySelector<HTMLInputElement>(`[name="${CSS.escape(previewField)}"]`);
            setPreview(field ? field.value.trim() : "");
        };
        readPreview(); // picks up values put back after a failed submit
        // "invalid" doesn't bubble, so it's caught on the way down instead.
        const onInvalid = () => {
            el.open = true;
            setOpen(true);
        };
        el.addEventListener("invalid", onInvalid, true);
        el.addEventListener("input", readPreview);
        return () => {
            el.removeEventListener("invalid", onInvalid, true);
            el.removeEventListener("input", readPreview);
        };
    }, [previewField]);

    return (
        <details
            ref={details}
            open={open}
            onToggle={(event) => setOpen(event.currentTarget.open)}
            className="group rounded-md border border-zinc-200"
        >
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-800 select-none hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="size-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-90"
                >
                    <path fill="currentColor" d="M7.2 4.8a.75.75 0 0 1 1.06 0l4.67 4.67a.75.75 0 0 1 0 1.06L8.26 15.2a.75.75 0 1 1-1.06-1.06L11.34 10 7.2 5.86a.75.75 0 0 1 0-1.06Z" />
                </svg>
                <span>{summary}</span>
                {!open && preview && <span className="min-w-0 truncate font-normal text-zinc-500">· {preview}</span>}
            </summary>
            <div className="flex flex-col gap-3 border-t border-zinc-200 px-3 pt-3 pb-4">{children}</div>
        </details>
    );
}
