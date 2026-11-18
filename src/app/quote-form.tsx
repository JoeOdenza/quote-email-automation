"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { createQuoteEmail, previewQuoteEmail, type FormState, type PreviewState } from "./actions";
import { Accordion } from "./ui/accordion";
import { Field, FormMessage, Input, Section, inputClass, primaryButton } from "./ui/form";
import { StayFields } from "./ui/stay-fields";
import { PRICE_PATTERN, PROFILE_NUM_PATTERN } from "@/libs/validation";
import { withBasePath } from "@/libs/base-path";
import { getColorScheme, swatchColors } from "@/libs/color-schemes";
import { currencies, quoteTypes, tierExamples, tierLabels, type QuoteType } from "@/libs/tiers";

export type ThemeOption = { id: number; name: string; colorScheme: string; bannerSrc: string };

// Picks the email's theme (its pictures and colours), with its banner and a
// strip of its main colours so agents can see what they're choosing.
function ThemePicker({ themes }: { themes: ThemeOption[] }) {
    const [id, setId] = useState<string>(String(themes[0]?.id ?? ""));
    if (themes.length === 0) {
        return (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                There are no themes yet, and every email needs one.{" "}
                <Link href="/themes/new" className="font-semibold underline">
                    Add one on the Themes page
                </Link>
                .
            </p>
        );
    }
    const chosen = themes.find((theme) => String(theme.id) === id);
    const palette = chosen && getColorScheme(chosen.colorScheme)?.palette;
    return (
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
                <Field label="Theme" hint="Sets the banner, the three quote pictures and the email's colours.">
                    <select name="theme" value={id} onChange={(e) => setId(e.target.value)} className={inputClass}>
                        {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.name}
                            </option>
                        ))}
                    </select>
                </Field>
                {palette && (
                    <div aria-hidden="true" className="flex h-6 overflow-hidden rounded-md border border-zinc-200">
                        {swatchColors(palette).map((color) => (
                            <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                        ))}
                    </div>
                )}
            </div>
            {chosen && (
                // eslint-disable-next-line @next/next/no-img-element -- uploads, shown as stored
                <img
                    src={withBasePath(chosen.bannerSrc)}
                    alt=""
                    width={720}
                    height={200}
                    className="aspect-[18/5] w-full rounded-md border border-zinc-200 object-cover sm:aspect-auto sm:h-0 sm:min-h-full sm:max-w-[31rem] sm:justify-self-center"
                />
            )}
        </div>
    );
}

type IncentiveOption = { id: string; title: string; description: string | null; code: string | null };

const tierHints: Record<QuoteType, string> = {
    promo: "The quote you discussed with the guest.",
    upgrade: "A step up from the base quote.",
    hailMary: "The top-tier offer.",
};

type QuoteFormProps = { incentives: IncentiveOption[]; themes: ThemeOption[]; hasAgent: boolean };

// The form, then a preview of the email. Nothing is saved until "Save email"
// on the preview: "Revise" goes back to the form as it was, and "Cancel"
// throws the quote away and starts again with an empty form.
export function QuoteForm(props: QuoteFormProps) {
    // A new key gives a fresh, empty form.
    const [formKey, setFormKey] = useState(0);
    return <QuoteFormSteps key={formKey} {...props} onCancel={() => setFormKey((key) => key + 1)} />;
}

function QuoteFormSteps({ incentives, themes, hasAgent, onCancel }: QuoteFormProps & { onCancel: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [preview, previewAction, previewing] = useActionState<PreviewState, FormData>(previewQuoteEmail, {});
    const [saved, saveAction, saving] = useActionState<FormState, FormData>(createQuoteEmail, {});
    const [wantsPreview, setWantsPreview] = useState(false);
    const showPreview = wantsPreview && !previewing && preview.html !== undefined;

    // Submitted by hand, rather than as the form's action, so React doesn't
    // clear the form afterwards: "Revise" brings it back exactly as it was.
    function onPreview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setWantsPreview(true);
        startTransition(() => previewAction(formData));
    }

    // The form is only hidden during the preview, so this saves exactly what
    // was previewed (the server checks it all again).
    function onSave() {
        const formData = new FormData(formRef.current!);
        startTransition(() => saveAction(formData));
    }

    function onDiscard() {
        if (window.confirm("Discard this quote? Nothing has been saved, and the form will be cleared.")) onCancel();
    }

    return (
        <>
            {showPreview && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="text-base font-semibold text-[#14304f]">Check the email</h2>
                            <p className="text-sm text-zinc-600">
                                Not saved yet. Save it to keep it under Past emails and make an Outlook draft.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onDiscard}
                                disabled={saving}
                                className="rounded-md px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setWantsPreview(false)}
                                disabled={saving}
                                className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                            >
                                Revise
                            </button>
                            <button type="button" onClick={onSave} disabled={saving} className={primaryButton}>
                                {saving ? "Saving…" : "Save email"}
                            </button>
                        </div>
                    </div>
                    <FormMessage error={saved.error} />
                    <iframe
                        srcDoc={preview.html}
                        title="Email preview"
                        sandbox=""
                        className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white"
                    />
                </div>
            )}
            <form ref={formRef} onSubmit={onPreview} hidden={showPreview} className="flex flex-col gap-5">
                {!hasAgent && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Your agent details aren&apos;t set yet, and every email needs them.{" "}
                        <Link href="/settings" className="font-semibold underline">
                            Add them in Settings
                        </Link>
                        .
                    </p>
                )}

                <Section title="Guest">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Guest name">
                            <Input name="guestName" required autoComplete="off" />
                        </Field>
                        <Field label="Guest email">
                            <Input name="guestEmail" type="email" required autoComplete="off" />
                        </Field>
                        <Field label="Profile number" hint="6 digits, from ClientBase">
                            <Input
                                name="guestProfileNum"
                                required
                                autoComplete="off"
                                inputMode="numeric"
                                pattern={PROFILE_NUM_PATTERN}
                                minLength={6}
                                maxLength={6}
                                title="Exactly 6 digits"
                                placeholder="123456"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Theme">
                    <ThemePicker themes={themes} />
                </Section>

                <div className="grid gap-5 lg:grid-cols-3">
                    {quoteTypes.map((type) => (
                        <Section key={type} title={`${tierLabels[type]} quote`}>
                            <p className="-mt-2 mb-4 text-xs text-zinc-500">{tierHints[type]}</p>
                            <div className="mb-4 flex flex-col gap-3">
                                <Accordion summary="Accommodation details" previewField={`${type}.title`}>
                                    <Field label="Title">
                                        <Input
                                            name={`${type}.title`}
                                            required
                                            autoComplete="off"
                                            placeholder={tierExamples[type].title}
                                        />
                                    </Field>
                                    <StayFields name={type} nightsPlaceholder={tierExamples[type].nights} />
                                    <Field label="Accommodation description">
                                        <textarea
                                            name={`${type}.description`}
                                            required
                                            rows={3}
                                            placeholder={tierExamples[type].description}
                                            className={inputClass}
                                        />
                                    </Field>
                                </Accordion>
                            </div>
                            <div className="grid grid-cols-[1fr_6rem] gap-3">
                                <Field label="Price">
                                    <Input
                                        name={`${type}.price`}
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        pattern={PRICE_PATTERN}
                                        title="A dollar amount with up to two decimals, e.g. 1299 or 1,299.50"
                                        required
                                        placeholder="1,299.00"
                                    />
                                </Field>
                                <Field label="Currency">
                                    <select name={`${type}.currency`} className={inputClass} defaultValue="USD">
                                        {currencies.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <fieldset className="mt-5">
                                <legend className="mb-2 text-sm font-medium text-zinc-700">Incentives</legend>
                                {incentives.length === 0 ? (
                                    <p className="text-xs text-zinc-500">No incentives set up yet.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {incentives.map((incentive) => (
                                            <label
                                                key={incentive.id}
                                                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50 has-[:checked]:border-[#0045a5] has-[:checked]:bg-[#f4f7fb]"
                                            >
                                                <input
                                                    type="checkbox"
                                                    name={`${type}.incentives`}
                                                    value={incentive.id}
                                                    className="mt-0.5 size-4 accent-[#0045a5]"
                                                />
                                                <span className="text-sm">
                                                    <span className="font-medium text-zinc-900">{incentive.title}</span>
                                                    {incentive.code && (
                                                        <code className="ml-1.5 font-mono text-[11px] text-zinc-500">
                                                            {incentive.code}
                                                        </code>
                                                    )}
                                                    {incentive.description && (
                                                        <span className="block text-xs text-zinc-500">
                                                            {incentive.description}
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </fieldset>
                        </Section>
                    ))}
                </div>

                <FormMessage error={preview.error} />

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={previewing || !hasAgent || themes.length === 0}
                        className={primaryButton}
                    >
                        {previewing ? "Building preview…" : "Preview email"}
                    </button>
                </div>
            </form>
        </>
    );
}
