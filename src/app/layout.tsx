import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavLinks from "@/components/NavLinks";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Volopay e-invoicing prototype (UAE)",
  description:
    "Simulated UAE e-invoicing flow: create, check, submit to a simulated provider, fix and resubmit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-950">
          <span className="rounded bg-amber-400 px-1.5 py-0.5 font-bold uppercase tracking-wide">Simulated</span>
          No real provider, tax authority or accounting system is connected. All companies and tax numbers are fictional.
        </div>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">V</span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Volopay e-invoicing</div>
                <div className="text-xs text-slate-500">UAE prototype</div>
              </div>
            </div>
            <Suspense fallback={null}>
              <NavLinks />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500">
          Prototype for the Volopay Founder&apos;s Office assignment · Simulated integrations only · Rules are marked sourced, assumed or simulated on the Rules page
        </footer>
      </body>
    </html>
  );
}
