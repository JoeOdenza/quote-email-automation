"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createQuoteEmail, type FormState } from "./actions";
import { Field, FormMessage, Input, Section, inputClass, primaryButton } from "./ui/form";
import { currencies, heroImageTypes, quoteTypes, tierExamples, tierLabels, type QuoteType } from "@/libs/tiers";

type IncentiveOption = { id: string; title: string; description: string | null; code: string | null };

const tierHints: Record<QuoteType, string> = {
    promo: "The quote you discussed with the guest.",
    upgrade: "A step up from the base quote.",
    hailMary: "The top-tier offer.",
};

export function QuoteForm({ incentives, hasAgent }: { incentives: IncentiveOption[]; hasAgent: boolean }) {
    const [state, action, pending] = useActionState<FormState, FormData>(createQuoteEmail, {});
    const v = state.values ?? {};
    const str = (name: string) => (typeof v[name] === "string" ? (v[name] as string) : undefined);
    const checked = (type: QuoteType, id: string) => {
        const list = v[`${type}.incentives`];
        return Array.isArray(list) && list.includes(id);
    };

    return (
        // Keyed on state so inputs pick up the returned values after an error.
        <form key={JSON.stringify(v)} action={action} className="flex flex-col gap-5">
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
                        <Input name="guestName" required autoComplete="off" defaultValue={str("guestName")} />
                    </Field>
                    <Field label="Guest email">
                        <Input name="guestEmail" type="email" required autoComplete="off" defaultValue={str("guestEmail")} />
                    </Field>
                    <Field label="Profile number" hint="From ClientBase">
                        <Input name="guestProfileNum" required autoComplete="off" defaultValue={str("guestProfileNum")} />
                    </Field>
                </div>
            </Section>

            <Section title="Banner image">
                <Field
                    label="Top banner"
                    hint="Optional. JPG, PNG, GIF or WebP up to 5MB. It's cropped to fit the 1200 × 440 banner automatically, so wide photos work best. Leave empty to use the default banner."
                >
                    <input
                        name="heroImage"
                        type="file"
                        accept={heroImageTypes.join(",")}
                        className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
                    />
                </Field>
            </Section>

            <div className="grid gap-5 lg:grid-cols-3">
                {quoteTypes.map((type) => (
                    <Section key={type} title={`${tierLabels[type]} quote`}>
                        <p className="-mt-2 mb-4 text-xs text-zinc-500">{tierHints[type]}</p>
                        <div className="mb-4 flex flex-col gap-3">
                            <Field label="Title">
                                <Input
                                    name={`${type}.title`}
                                    required
                                    autoComplete="off"
                                    placeholder={tierExamples[type].title}
                                    defaultValue={str(`${type}.title`)}
                                />
                            </Field>
                            <Field label="Duration of trip">
                                <Input
                                    name={`${type}.duration`}
                                    required
                                    autoComplete="off"
                                    placeholder={tierExamples[type].duration}
                                    defaultValue={str(`${type}.duration`)}
                                />
                            </Field>
                            <Field label="Accommodation description">
                                <textarea
                                    name={`${type}.description`}
                                    required
                                    rows={3}
                                    placeholder={tierExamples[type].description}
                                    defaultValue={str(`${type}.description`)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-[1fr_6rem] gap-3">
                            <Field label="Price">
                                <Input
                                    name={`${type}.price`}
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    defaultValue={str(`${type}.price`)}
                                />
                            </Field>
                            <Field label="Currency">
                                <select
                                    name={`${type}.currency`}
                                    className={inputClass}
                                    defaultValue={str(`${type}.currency`) ?? "USD"}
                                >
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
                                                defaultChecked={checked(type, incentive.id)}
                                                className="mt-0.5 size-4 accent-[#0045a5]"
                                            />
                                            <span className="text-sm">
                                                <span className="font-medium text-zinc-900">{incentive.title}</span>
                                                {incentive.code && (
                                                    <code className="ml-1.5 font-mono text-[11px] text-zinc-500">{incentive.code}</code>
                                                )}
                                                {incentive.description && (
                                                    <span className="block text-xs text-zinc-500">{incentive.description}</span>
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

            <FormMessage error={state.error} />

            <div className="flex justify-end">
                <button type="submit" disabled={pending || !hasAgent} className={primaryButton}>
                    {pending ? "Generating…" : "Generate email"}
                </button>
            </div>
        </form>
    );
}
