"use client";

import { useState } from "react";
import { primaryButton } from "../../ui/form";

export function CopyButton({ text }: { text: string }) {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
            setStatus("copied");
        } catch {
            setStatus("failed");
        }
        setTimeout(() => setStatus("idle"), 2000);
    }

    return (
        <button type="button" onClick={copy} className={primaryButton}>
            {status === "copied" ? "Copied!" : status === "failed" ? "Couldn't copy" : "Copy raw HTML"}
        </button>
    );
}
