import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTheme } from "@/db/queries";
import { ThemeForm } from "../theme-form";

async function EditTheme({ params }: { params: PageProps<"/themes/[id]">["params"] }) {
    const { id } = await params;
    const themeId = Number(id);
    const theme = Number.isInteger(themeId) && themeId > 0 ? await getTheme(themeId) : null;
    if (!theme) notFound();

    return (
        <>
            <h1 className="text-2xl font-semibold text-[#14304f]">Edit {theme.name}</h1>
            <ThemeForm
                theme={{
                    id: theme.id,
                    name: theme.name,
                    colorScheme: theme.colorScheme,
                    active: theme.active,
                    images: {
                        banner: theme.bannerSrc,
                        base: theme.baseSrc,
                        upgrade: theme.upgradeSrc,
                        premium: theme.premiumSrc,
                    },
                }}
            />
        </>
    );
}

export default function EditThemePage({ params }: PageProps<"/themes/[id]">) {
    return (
        <main className="flex flex-col gap-5">
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <EditTheme params={params} />
            </Suspense>
        </main>
    );
}
