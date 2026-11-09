import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AccountMenu } from "./ui/account-menu";
import { NavTabs } from "./ui/nav-tabs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quote Emails",
  description: "Build and keep quote emails for guests",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-100 font-sans text-zinc-900">
        <header className="bg-[#14304f]">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-base font-semibold text-white">Quote Emails</span>
            <div className="flex flex-wrap items-center gap-4">
              <NavTabs />
              <Suspense fallback={null}>
                <AccountMenu />
              </Suspense>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
