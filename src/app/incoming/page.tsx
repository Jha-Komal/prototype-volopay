"use client";

import { useState } from "react";
import { decideIncoming, useHydrated, useStore } from "@/lib/store";
import { matchIncoming } from "@/lib/incoming";
import { PURCHASE_ORDERS } from "@/lib/seed";
import { formatAed, round2 } from "@/lib/validate";
import { SimTag, btnDanger, btnPrimary, card } from "@/components/ui";

export default function IncomingPage() {
  const { incoming } = useStore();
  const hydrated = useHydrated();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incoming invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          The receive side. Supplier e-invoices arrive as structured data through the provider <SimTag />, and Volopay matches them to the supplier list and purchase order before anyone approves payment. These matching rules are assumed for the demo.
        </p>
      </div>

      <section className={card}>
        <h2 className="text-sm font-semibold">Open purchase orders (sample data)</h2>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {PURCHASE_ORDERS.map((p) => (
            <li key={p.number} className="rounded-lg bg-slate-50 p-3"><span className="font-mono font-medium">{p.number}</span> · {p.supplierName} · {formatAed(p.amount)}</li>
          ))}
        </ul>
      </section>

      <div className={`space-y-4 ${hydrated ? "" : "opacity-50"}`}>
        {incoming.map((inv) => {
          const checks = matchIncoming(inv);
          const allPass = checks.every((c) => c.pass);
          const total = round2(inv.net + inv.vat);
          const done = inv.status !== "received";
          return (
            <article key={inv.id} className={card}>
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <div className="text-lg font-semibold">{inv.number} <span className="text-sm font-normal text-slate-500">from {inv.supplier.name}</span></div>
                  <div className="text-sm text-slate-600">{inv.description} · PO {inv.poNumber} · TRN <span className="font-mono">{inv.supplier.trn}</span></div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xl font-semibold tabular-nums">{formatAed(total)}</div>
                  <div className="text-xs text-slate-500">incl. VAT {formatAed(inv.vat)}</div>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {checks.map((c) => (
                  <li key={c.id} className={`flex gap-2 rounded-lg p-2.5 text-sm ${c.pass ? "bg-emerald-50" : "bg-red-50"}`}>
                    <span className={`mt-0.5 font-bold ${c.pass ? "text-emerald-700" : "text-red-700"}`}>{c.pass ? "✓" : "✕"}</span>
                    <span><span className="font-mono text-xs text-slate-500">{c.id}</span> {c.label}<span className="block text-xs text-slate-600">{c.detail}</span></span>
                  </li>
                ))}
              </ul>

              {done ? (
                <div className={`mt-4 rounded-lg p-3 text-sm ${inv.status === "approved" ? "bg-emerald-50 text-emerald-900" : "bg-orange-50 text-orange-900"}`}>
                  <b>{inv.status === "approved" ? "Approved for payment" : "Rejected"}</b>{inv.decisionNote ? `: ${inv.decisionNote}` : ""} <span className="text-xs">(sample decision, no payment made)</span>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button className={btnPrimary} disabled={!allPass} title={allPass ? "" : "Resolve the failed checks, or reject the invoice"}
                    onClick={() => decideIncoming(inv.id, "approved", "All matching checks passed.")}>Approve for payment</button>
                  <input
                    aria-label={`Reason to reject ${inv.number}`}
                    className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={allPass ? "Reason (optional)" : "Reason for rejecting"}
                    value={reasons[inv.id] ?? ""}
                    onChange={(e) => setReasons({ ...reasons, [inv.id]: e.target.value })}
                  />
                  <button className={btnDanger}
                    onClick={() => decideIncoming(inv.id, "rejected", reasons[inv.id]?.trim() || checks.filter((c) => !c.pass).map((c) => c.id).join(", ") || "Rejected by reviewer")}>Reject</button>
                  {!allPass && <span className="text-xs text-red-700">Approval is blocked until all checks pass.</span>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
