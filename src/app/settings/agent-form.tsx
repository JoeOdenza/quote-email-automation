"use client";

import { useActionState } from "react";
import { saveAgent, type FormState } from "../actions";
import { Field, FormMessage, Input, Section, primaryButton } from "../ui/form";

type AgentValues = { name: string; agentNum: string; email: string; phone: string; schedule: string };

export function AgentForm({ agent }: { agent: AgentValues | null }) {
    const [state, action, pending] = useActionState<FormState, FormData>(saveAgent, {});
    const value = (name: keyof AgentValues) => {
        const submitted = state.values?.[name];
        return typeof submitted === "string" ? submitted : (agent?.[name] ?? "");
    };

    return (
        <form key={JSON.stringify(state.values ?? agent)} action={action} className="flex max-w-2xl flex-col gap-5">
            <Section title="Agent information">
                <p className="-mt-2 mb-4 text-xs text-zinc-500">
                    Shown in the header and footer of every email you generate. Changes apply to new emails only.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                        <Input name="name" required defaultValue={value("name")} />
                    </Field>
                    <Field label="Agent number">
                        <Input name="agentNum" required defaultValue={value("agentNum")} />
                    </Field>
                    <Field label="Email">
                        <Input name="email" type="email" required defaultValue={value("email")} />
                    </Field>
                    <Field label="Phone number">
                        <Input name="phone" type="tel" required defaultValue={value("phone")} />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Schedule" hint="e.g. Mon–Fri, 9am–5pm ET">
                            <Input name="schedule" defaultValue={value("schedule")} />
                        </Field>
                    </div>
                </div>
            </Section>

            <FormMessage error={state.error} success={state.saved ? "Saved." : undefined} />

            <div>
                <button type="submit" disabled={pending} className={primaryButton}>
                    {pending ? "Saving…" : "Save"}
                </button>
            </div>
        </form>
    );
}
