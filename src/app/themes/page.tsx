import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listAllThemes } from "@/db/queries";
import { withBasePath } from "@/libs/base-path";
import { getColorScheme, swatchColors } from "@/libs/color-schemes";
import { primaryButton } from "../ui/form";

async function ThemeList() {
    await connection();
    const themes = await listAllThemes();
    if (themes.length === 0) {
        return (
            <p className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm">
                No themes yet. Add one to start making quote emails.
            </p>
        );
    }

    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => {
                const scheme = getColorScheme(theme.colorScheme);
                return (
                    <li key={theme.id}>
                        <Link
                            href={`/themes/${theme.id}`}
                            className="block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm hover:border-[#0045a5]/40 hover:shadow"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- uploads, shown as stored */}
                            <img
                                src={withBasePath(theme.bannerSrc)}
                                alt=""
                                width={720}
                                height={200}
                                className={`aspect-[18/5] w-full object-cover ${theme.active ? "" : "opacity-50 grayscale"}`}
                            />
                            <div className="flex items-center gap-3 px-4 py-3">
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={`block truncate font-medium ${theme.active ? "text-zinc-900" : "text-zinc-500"}`}
                                    >
                                        {theme.name}
                                    </span>
                                    <span className="block text-xs text-zinc-500">{scheme?.name ?? "Default colours"}</span>
                                </span>
                                {scheme && (
                                    <span aria-hidden="true" className="flex h-5 overflow-hidden rounded border border-zinc-200">
                                        {swatchColors(scheme.palette).map((color) => (
                                            <span key={color} className="w-3" style={{ backgroundColor: color }} />
                                        ))}
                                    </span>
                                )}
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        theme.active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"
                                    }`}
                                >
                                    {theme.active ? "Active" : "Retired"}
                                </span>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export default function ThemesPage() {
    return (
        <main className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-[#14304f]">Themes</h1>
                    <p className="text-sm text-zinc-600">
                        The pictures and colours a quote email can use. Shared by everyone.
                    </p>
                </div>
                <Link href="/themes/new" className={primaryButton}>
                    Add theme
                </Link>
            </div>
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
                <ThemeList />
            </Suspense>
        </main>
    );
}
