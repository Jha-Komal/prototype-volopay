"use client";

import Link from "next/link";
import { useHydrated, useStore, resetSampleData } from "@/lib/store";
import { formatAed, invoiceTotals } from "@/lib/validate";
import { SCENARIOS } from "@/lib/seed";
import { StatusChip, btnGhost, btnPrimary, card } from "@/components/ui";

export default function InvoicesPage() {
  const { invoices } = useStore();
  const hydrated = useHydrated();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <div className="ml-auto flex gap-2">
          <button
            className={btnGhost}
            onClick={() => {
              if (confirm("Reset all invoices back to the sample data?")) resetSampleData();
            }}
          >
            Reset sample data
          </button>
          <Link href="/invoices/new" className={btnPrimary}>New invoice</Link>
        </div>
      </div>

      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">Number</th>
              <th className="px-4 py-2.5">Buyer</th>
              <th className="px-4 py-2.5">Issued</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className={hydrated ? "" : "opacity-60"}>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/invoices/${inv.id}`} className="text-blue-700 hover:underline">{inv.number}</Link>
                </td>
                <td className="px-4 py-3">{inv.buyer.name}</td>
                <td className="px-4 py-3 text-zinc-600">{inv.issueDate}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatAed(invoiceTotals(inv).gross)}</td>
                <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No invoices. Reset the sample data or create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <section className={card}>
        <h2 className="mb-2 text-sm font-semibold">Try these sample scenarios</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <Link href={`/invoices/${s.id}`} className="block rounded-md border border-zinc-200 p-3 hover:border-zinc-400">
                <span className="font-medium">{s.title}</span>
                <span className="block text-zinc-600">{s.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
