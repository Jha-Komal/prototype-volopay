import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">
        <div className="sticky top-0 z-20 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          SIMULATED. No real provider, tax authority or accounting system is connected. All companies and tax numbers are fictional.
        </div>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">
              Volopay <span className="font-normal text-zinc-500">e-invoicing · UAE prototype</span>
            </Link>
            <nav className="ml-auto flex gap-4 text-zinc-600">
              <Link href="/" className="hover:text-black">Invoices</Link>
              <Link href="/rules" className="hover:text-black">Rules &amp; architecture</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="px-4 py-6 text-center text-xs text-zinc-500">
          Prototype for the Volopay Founder&apos;s Office assignment. Simulated integrations only.
        </footer>
      </body>
    </html>
  );
}
