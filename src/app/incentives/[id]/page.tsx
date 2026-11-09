import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getIncentiveType } from "@/db/queries";
import { IncentiveForm } from "../incentive-form";

async function EditIncentive({ params }: { params: PageProps<"/incentives/[id]">["params"] }) {
    const { id } = await params;
    const incentive = await getIncentiveType(id);
    if (!incentive) notFound();

    return (
        <>
            <h1 className="text-2xl font-semibold text-[#14304f]">Edit {incentive.title}</h1>
            <IncentiveForm
                incentive={{
                    id: incentive.id,
                    title: incentive.title,
                    description: incentive.description ?? "",
                    code: incentive.code ?? "",
                    srcImg: incentive.srcImg,
                    active: incentive.active,
                    issued: incentive.issued,
                }}
            />
        </>
    );
}

export default function EditIncentivePage({ params }: PageProps<"/incentives/[id]">) {
    return (
        <main className="flex flex-col gap-5">
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <EditIncentive params={params} />
            </Suspense>
        </main>
    );
}
