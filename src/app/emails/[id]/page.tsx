import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getEmail } from "@/db/queries";
import { formatDateTime, formatMoney } from "@/libs/format";
import { tierLabels, type QuoteType } from "@/libs/tiers";
import { currentAccount } from "@/libs/session";
import { createOutlookDraft } from "../../actions";
import { CopyButton } from "./copy-button";
import { OutlookDraft } from "./outlook-draft";

async function EmailDetail({ params }: { params: PageProps<"/emails/[id]">["params"] }) {
    const { id } = await params;
    const emailId = Number(id);
    if (!Number.isInteger(emailId)) notFound();

    const [data, account] = await Promise.all([getEmail(emailId), currentAccount()]);
    if (!data) notFound();
    const { email, guest, layers } = data;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold text-[#14304f]">{guest.guestName}</h2>
                    <p className="text-sm text-zinc-600">
                        {guest.guestEmail} · Profile #{guest.guestProfileNum}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Generated {formatDateTime(email.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-start justify-end gap-3">
                    <CopyButton text={email.html} />
                    <OutlookDraft
                        action={createOutlookDraft.bind(null, email.id)}
                        signedInAs={account?.email ?? null}
                        draft={
                            email.outlookDraftAt
                                ? { link: email.outlookDraftLink, savedAt: formatDateTime(email.outlookDraftAt) }
                                : null
                        }
                        returnTo={`/emails/${email.id}`}
                    />
                </div>

                <dl className="grid w-full gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3">
                    {layers.map((layer) => (
                        <div key={layer.id}>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                {tierLabels[layer.quoteType as QuoteType]}
                            </dt>
                            {layer.title && <dd className="text-sm text-zinc-700">{layer.title}</dd>}
                            {layer.duration && <dd className="text-xs text-zinc-500">{layer.duration}</dd>}
                            <dd className="text-sm font-medium text-zinc-900">
                                {formatMoney(layer.priceCents, layer.currency)}
                            </dd>
                            {layer.incentives.length > 0 && (
                                <dd className="mt-1">
                                    <ul className="flex flex-col gap-0.5 text-xs text-zinc-600">
                                        {layer.incentives.map((i) => (
                                            <li key={i.code}>
                                                {i.title} <code className="font-mono text-[11px] text-zinc-500">{i.code}</code>
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            )}
                        </div>
                    ))}
                </dl>
            </div>

            <iframe
                srcDoc={email.html}
                title={`Quote email for ${guest.guestName}`}
                sandbox=""
                className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white"
            />
        </div>
    );
}

export default function EmailPage({ params }: PageProps<"/emails/[id]">) {
    return (
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
            <EmailDetail params={params} />
        </Suspense>
    );
}
