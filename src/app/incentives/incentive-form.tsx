"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { saveIncentive, type FormState } from "../actions";
import { Field, FormMessage, Input, Section, inputClass, primaryButton } from "../ui/form";
import {
    CODE_MAX,
    DESCRIPTION_MAX,
    ICON_SIZE,
    TITLE_MAX,
    iconImageTypes,
    placeholderIcon,
} from "@/libs/incentives";
import { renderIncentivePreview } from "@/libs/render";
import { tierLabels } from "@/libs/tiers";

export type IncentiveValues = {
    id: string;
    title: string;
    description: string;
    code: string;
    srcImg: string | null;
    active: boolean;
    issued: number;
};

// Crops the chosen file to a centred square, the same way the server will,
// so the preview matches what gets saved.
async function squareIcon(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = ICON_SIZE;
    canvas
        .getContext("2d")!
        .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, ICON_SIZE, ICON_SIZE);
    bitmap.close();
    return canvas.toDataURL("image/png");
}

function Fields({ incentive, state, pending }: { incentive: IncentiveValues | null; state: FormState; pending: boolean }) {
    const submitted = (name: string) => {
        const value = state.values?.[name];
        return typeof value === "string" ? value : undefined;
    };
    const [title, setTitle] = useState(submitted("title") ?? incentive?.title ?? "");
    const [description, setDescription] = useState(submitted("description") ?? incentive?.description ?? "");
    const [code, setCode] = useState(submitted("code") ?? incentive?.code ?? "");
    const [chosenIcon, setChosenIcon] = useState<string | null>(null);
    const [iconError, setIconError] = useState<string>();

    const iconSrc = chosenIcon ?? incentive?.srcImg ?? placeholderIcon(title);
    const preview = renderIncentivePreview(
        {
            id: incentive?.id ?? "new",
            title: title.trim() || "Incentive title",
            description: description.trim(),
            srcImg: iconSrc,
        },
        tierLabels,
    );

    async function onIconChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        setIconError(undefined);
        if (!file) return setChosenIcon(null);
        try {
            setChosenIcon(await squareIcon(file));
        } catch {
            setChosenIcon(null);
            setIconError("That file couldn't be read as an image. Try a different one.");
        }
    }

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_minmax(0,34rem)]">
            <div className="flex flex-col gap-5">
                <Section title="Details">
                    {incentive && <input type="hidden" name="id" value={incentive.id} />}
                    <div className="flex flex-col gap-4">
                        <Field label="Title" hint="Shown to the guest in bold, e.g. “$150 future travel credit”.">
                            <Input
                                name="title"
                                required
                                maxLength={TITLE_MAX}
                                autoComplete="off"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Field>
                        <Field label="Description" hint="One short line under the title.">
                            <textarea
                                name="description"
                                rows={2}
                                maxLength={DESCRIPTION_MAX}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Internal code" hint="e.g. DCOGC. Agents see it on the quote form; guests never do.">
                            <input
                                name="code"
                                maxLength={CODE_MAX}
                                autoComplete="off"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className={`${inputClass} font-mono`}
                            />
                        </Field>
                        <Field
                            label={incentive ? "Replace icon" : "Icon"}
                            hint={
                                incentive
                                    ? "Leave empty to keep the current icon. Emails already sent keep the icon they were sent with."
                                    : "Optional. JPG, PNG, GIF or WebP up to 2MB, cropped to a square from the centre. Leave empty for a placeholder."
                            }
                        >
                            <input
                                name="icon"
                                type="file"
                                accept={iconImageTypes.join(",")}
                                onChange={onIconChange}
                                className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
                            />
                        </Field>
                        {iconError && <p className="text-xs text-red-700">{iconError}</p>}
                        {incentive && (
                            <label className="flex cursor-pointer items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    name="active"
                                    defaultChecked={state.values ? state.values.active === "on" : incentive.active}
                                    className="mt-0.5 size-4 accent-[#0045a5]"
                                />
                                <span className="text-sm">
                                    <span className="font-medium text-zinc-900">Offer on new quotes</span>
                                    <span className="block text-xs text-zinc-500">
                                        Untick to retire it. Emails that already include it aren&apos;t affected.
                                    </span>
                                </span>
                            </label>
                        )}
                    </div>
                </Section>

                {incentive && incentive.issued > 0 && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Issued {incentive.issued} {incentive.issued === 1 ? "time" : "times"}. Emails already sent won&apos;t
                        change, but their records under Past emails show the current title. To change what the offer
                        actually is, retire this one and add a new incentive instead.
                    </p>
                )}

                <FormMessage error={state.error} />

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={pending} className={primaryButton}>
                        {pending ? "Saving…" : incentive ? "Save changes" : "Add incentive"}
                    </button>
                    <Link href="/incentives" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                        Cancel
                    </Link>
                </div>
            </div>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                <h2 className="mb-1 text-base font-semibold text-[#14304f]">Preview</h2>
                <p className="mb-3 text-xs text-zinc-500">How it appears in each quote card of the email.</p>
                <iframe
                    srcDoc={preview}
                    title="Incentive preview"
                    sandbox=""
                    className="h-[480px] w-full rounded-md border border-zinc-200"
                />
            </section>
        </div>
    );
}

export function IncentiveForm({ incentive }: { incentive: IncentiveValues | null }) {
    const [state, action, pending] = useActionState<FormState, FormData>(saveIncentive, {});
    return (
        // Keyed on state so the fields pick up the returned values after an error.
        <form key={JSON.stringify(state.values ?? null)} action={action}>
            <Fields incentive={incentive} state={state} pending={pending} />
        </form>
    );
}
