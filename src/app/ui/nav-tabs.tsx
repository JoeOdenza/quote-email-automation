"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const tabs = [
    { href: "/", label: "New quote" },
    { href: "/emails", label: "Past emails" },
    { href: "/incentives", label: "Incentives" },
    { href: "/settings", label: "Settings" },
];

function Tabs({ pathname }: { pathname: string | null }) {
    const isActive = (href: string) =>
        pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

    return (
        <nav className="flex gap-1">
            {tabs.map((tab) => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={isActive(tab.href) ? "page" : undefined}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white aria-[current=page]:bg-white aria-[current=page]:text-[#14304f]"
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}

function ActiveTabs() {
    return <Tabs pathname={usePathname()} />;
}

// The pathname isn't known while dynamic routes prerender, so the tabs
// render without a highlight first and pick it up once the URL is known.
export function NavTabs() {
    return (
        <Suspense fallback={<Tabs pathname={null} />}>
            <ActiveTabs />
        </Suspense>
    );
}
