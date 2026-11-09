"use client";

import { useActionState } from "react";
import type { DraftState } from "../../actions";
import { primaryButton } from "../../ui/form";

type Props = {
    action: (prev: DraftState, formData: FormData) => Promise<DraftState>;
    signedInAs: string | null;
    draft: { link: string | null; savedAt: string } | null;
    returnTo: string;
};

export function OutlookDraft({ action, signedInAs, draft, returnTo }: Props) {
    const [state, formAction, pending] = useActionState(action, {});
    const signInHref = `/auth/signin?returnTo=${encodeURIComponent(returnTo)}`;

    if (!signedInAs) {
        return (
            <a href={signInHref} className={primaryButton}>
                Sign in to create an Outlook draft
            </a>
        );
    }

    return (
        <form action={formAction} className="flex flex-col items-end gap-1.5 text-right">
            <button type="submit" disabled={pending} className={primaryButton}>
                {pending ? "Creating draft…" : draft ? "Create another draft" : "Create Outlook draft"}
            </button>
            {draft && !state.error && (
                <p className="text-xs text-zinc-600">
                    Draft saved {draft.savedAt}
                    {draft.link && (
                        <>
                            {" · "}
                            <a href={draft.link} target="_blank" rel="noreferrer" className="font-medium text-[#0045a5] underline">
                                Open in Outlook
                            </a>
                        </>
                    )}
                </p>
            )}
            {state.error && (
                <p role="alert" className="max-w-xs text-xs text-red-700">
                    {state.error}{" "}
                    {state.needsSignIn && (
                        <a href={signInHref} className="font-medium underline">
                            Sign in
                        </a>
                    )}
                </p>
            )}
            <p className="text-xs text-zinc-500">Saved to Drafts for {signedInAs}. Nothing is sent.</p>
        </form>
    );
}
