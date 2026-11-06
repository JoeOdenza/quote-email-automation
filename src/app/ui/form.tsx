import type { ComponentProps, ReactNode } from "react";

// Shared form styling for the quote and settings pages.

export const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-[#0045a5] focus:outline-none focus:ring-2 focus:ring-[#0045a5]/20";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{label}</span>
            {children}
            {hint && <span className="text-xs text-zinc-500">{hint}</span>}
        </label>
    );
}

export function Input(props: ComponentProps<"input">) {
    return <input {...props} className={inputClass} />;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#14304f]">{title}</h2>
            {children}
        </section>
    );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
    if (error) {
        return (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
            </p>
        );
    }
    if (success) {
        return (
            <p aria-live="polite" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
            </p>
        );
    }
    return null;
}

export const primaryButton =
    "rounded-md bg-[#0045a5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003a8c] disabled:cursor-not-allowed disabled:opacity-60";
