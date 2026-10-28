"use client";

import Link from "next/link";
import { useState } from "react";
import { useHydrated, useStore, resetSampleData } from "@/lib/store";
import { formatAed, invoiceTotals } from "@/lib/validate";
import { SCENARIOS } from "@/lib/seed";
import type { Status } from "@/lib/types";
import { StatusChip, btnGhost, btnPrimary, card } from "@/components/ui";

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "blocked", label: "Blocked" },
  { key: "checked", label: "Checked" },
  { key: "rejected", label: "Rejected" },
  { key: "accepted", label: "Accepted" },
];

function paidLabel(inv: ReturnType<typeof useStore>["invoices"][number]) {
  if (!inv.payment) return inv.status === "accepted" ? <span className="text-slate-500">Unpaid</span> : <span className="text-slate-300">—</span>;
  const o = inv.payment.outcome;
  return <span className={o === "matched" ? "text-emerald-700" : "text-orange-700"}>{o === "matched" ? "Paid, matched" : o === "short" ? "Short paid" : "Overpaid"}</span>;
}

export default function InvoicesPage() {
  const { invoices } = useStore();
  const hydrated = useHydrated();
  const [filter, setFilter] = useState<"all" | Status>("all");

  const count = (s: Status) => invoices.filter((i) => i.status === s).length;
  const shown = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const tiles = [
    { label: "Needs attention", value: count("blocked") + count("rejected"), tone: "text-red-700", hint: "Blocked or rejected" },
    { label: "Ready to send", value: count("checked"), tone: "text-sky-700", hint: "Passed all checks" },
    { label: "Not yet checked", value: count("draft"), tone: "text-slate-700", hint: "Drafts" },
    { label: "Accepted", value: count("accepted"), tone: "text-emerald-700", hint: "By the simulated provider" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-slate-600">Create an invoice, check it, send it through the simulated provider and follow its status.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            className={btnGhost}
            onClick={() => { if (confirm("Reset all invoices back to the sample data?")) resetSampleData(); }}
          >
            Reset sample data
          </button>
          <Link href="/invoices/new" className={btnPrimary}>+ New invoice</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={card}>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.label}</div>
            <div className={`mt-1 text-3xl font-semibold tabular-nums ${t.tone}`}>{hydrated ? t.value : "–"}</div>
            <div className="text-xs text-slate-500">{t.hint}</div>
          </div>
        ))}
      </div>

      <div className={`${card} overflow-hidden p-0`}>
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-3 py-2" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === f.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {f.label}{f.key !== "all" ? ` (${count(f.key)})` : ` (${invoices.length})`}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Number</th>
                <th className="px-4 py-2.5 font-medium">Buyer</th>
                <th className="px-4 py-2.5 font-medium">Issued</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className={hydrated ? "" : "opacity-50"}>
              {shown.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${inv.id}`} className="text-indigo-700 hover:underline">{inv.number}</Link>
                    {inv.origin === "csv-import" && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">CSV</span>}
                  </td>
                  <td className="px-4 py-3">{inv.buyer.name}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.issueDate}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatAed(invoiceTotals(inv).gross)}</td>
                  <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
                  <td className="px-4 py-3 text-xs">{paidLabel(inv)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Nothing here. Try another filter, import a CSV or reset the sample data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Guided demo: five sample scenarios</h2>
        <p className="mb-3 text-sm text-slate-600">Each one shows a different path through the checks and the simulated provider.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <li key={s.id}>
              <Link href={`/invoices/${s.id}`} className="block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{s.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
