"use client";

import Link from "next/link";
import { useState } from "react";
import { applyFix, recordPayment, runCheck, submitInvoice, useHydrated, useInvoice } from "@/lib/store";
import { formatAed, invoiceTotals, lineNet } from "@/lib/validate";
import type { Fix } from "@/lib/types";
import { SimTag, Stepper, StatusChip, btnGhost, btnPrimary, card, field } from "@/components/ui";

const DOT: Record<string, string> = {
  draft: "bg-slate-400", checked: "bg-sky-500", blocked: "bg-red-500",
  submitted: "bg-violet-500", accepted: "bg-emerald-500", rejected: "bg-orange-500",
};

export default function InvoiceDetail({ id }: { id: string }) {
  const inv = useInvoice(id);
  const hydrated = useHydrated();
  const [busy, setBusy] = useState<"check" | "submit" | null>(null);
  const [payAmount, setPayAmount] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!inv) {
    return <p className="text-sm">Invoice not found. <Link className="text-indigo-700 underline" href="/">Back to invoices</Link></p>;
  }
  const totals = invoiceTotals(inv);
  const canEdit = inv.status !== "submitted" && inv.status !== "accepted";

  async function check() { setBusy("check"); await runCheck(id); setBusy(null); }
  async function submit() { setBusy("submit"); await submitInvoice(id); setBusy(null); }
  async function fix(f: Fix) { applyFix(id, f); await check(); }

  const issues = inv.status === "blocked" ? inv.lastCheck?.issues ?? [] : [];
  const resp = inv.providerResponse;
  const rejected = inv.status === "rejected" && resp;
  const amount = payAmount ?? totals.gross.toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-indigo-700 hover:underline">← All invoices</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{inv.number}</h1>
          <StatusChip status={inv.status} />
          {inv.origin === "csv-import" && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Imported from CSV</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            {canEdit && <Link href={`/invoices/${inv.id}/edit`} className={btnGhost}>Edit</Link>}
            <button className={btnGhost} disabled={busy !== null || !canEdit} onClick={check}>
              {busy === "check" ? "Checking…" : "Run checks"}
            </button>
            <button className={btnPrimary} disabled={busy !== null || inv.status !== "checked"} onClick={submit}
              title={inv.status === "checked" ? "" : "Submit unlocks once the checks pass"}>
              {inv.status === "submitted" ? "Waiting for provider…" : "Submit to simulated provider"}
            </button>
          </div>
        </div>
        <div className="mt-5 max-w-2xl"><Stepper status={inv.status} /></div>
      </div>

      <div aria-live="polite" className="space-y-4">
        {inv.status === "draft" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <b>Next step:</b> run the checks. Submit stays disabled until they pass.
          </div>
        )}
        {inv.status === "checked" && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <b>All Volopay checks passed.</b> Submit it to the simulated provider when ready.
          </div>
        )}
        {inv.status === "submitted" && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            Sent to the <b>simulated</b> provider. Waiting for its response, which takes about 2 to 3 seconds.
          </div>
        )}
        {inv.status === "accepted" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <b>Accepted</b> by the <b>simulated</b> provider. Reference <span className="font-mono">{resp?.reference}</span>.
          </div>
        )}

        {issues.length > 0 && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Blocked by Volopay checks. Nothing was sent.</h2>
            <p className="text-sm text-red-900/80">Fix the {issues.length} item{issues.length === 1 ? "" : "s"} below. Submit unlocks once every check passes.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {issues.map((i, n) => (
                <li key={n} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 p-2.5">
                  <span className="rounded bg-red-200 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-900">{i.ruleId}</span>
                  <span className="flex-1">{i.message}</span>
                  {i.fix ? (
                    <button className={`${btnGhost} !py-1 text-xs`} disabled={busy !== null} onClick={() => fix(i.fix!)}>{i.fix.label}</button>
                  ) : (
                    <Link href={`/invoices/${inv.id}/edit`} className={`${btnGhost} !py-1 text-xs`}>Fix in editor ({i.field})</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {rejected && (
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <h2 className="font-semibold text-orange-900">Rejected by the simulated provider <span className="ml-1 font-mono text-sm">{resp.code}</span></h2>
            <p className="mt-1 text-sm">{resp.message}</p>
            {resp.suggestion && (
              <button className={`${btnPrimary} mt-3`} disabled={busy !== null} onClick={() => fix(resp.suggestion!)}>
                Fix and re-check: {resp.suggestion.label}
              </button>
            )}
            <p className="mt-2 text-xs text-orange-900/80">The fix sends the invoice back to draft and re-checks it. Then press Submit again.</p>
          </section>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className={`${card} lg:col-span-3`}>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            {(["seller", "buyer"] as const).map((k) => (
              <div key={k}>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</div>
                <div className="font-medium">{inv[k].name}</div>
                <div className="font-mono text-xs text-slate-700">TRN {inv[k].trn || "missing"}</div>
                <div className="text-xs text-slate-600">{inv[k].address}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-600">Issued {inv.issueDate} · Due {inv.dueDate} · {inv.currency}</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-slate-500"><tr><th className="py-1.5 font-medium">Description</th><th className="font-medium">Qty</th><th className="font-medium">Price</th><th className="font-medium">VAT</th><th className="text-right font-medium">Net</th></tr></thead>
              <tbody>
                {inv.lines.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-2">{l.description}</td>
                    <td>{l.quantity} {l.unit}</td>
                    <td className="tabular-nums">{l.unitPrice}</td>
                    <td>{l.vatCode ? `${l.vatCode} · ${l.vatRate}%` : <span className="font-medium text-red-700">none</span>}</td>
                    <td className="text-right tabular-nums">{formatAed(lineNet(l))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto mt-4 w-60 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Net</dt><dd className="tabular-nums">{formatAed(totals.net)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">VAT</dt><dd className="tabular-nums">{formatAed(totals.vat)}</dd></div>
            <div className="flex justify-between border-t pt-1 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatAed(totals.gross)}</dd></div>
          </dl>
        </section>

        <section className={`${card} lg:col-span-2`}>
          <h2 className="mb-4 text-sm font-semibold">Status timeline</h2>
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {inv.events.map((e) => (
              <li key={e.id} className="relative text-sm">
                <span className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${DOT[e.status]}`} />
                <div className="font-medium capitalize">{e.status}{e.code ? <span className="ml-2 font-mono text-xs text-slate-500">{e.code}</span> : null}</div>
                <div className="text-slate-700">{e.message}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  {new Date(e.at).toLocaleString()} · {e.source === "simulated-provider" ? <><span>Provider</span><SimTag /></> : "Volopay"}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {inv.status === "accepted" && (
        <section className={card}>
          <h2 className="text-sm font-semibold">Collections: record a payment and match it</h2>
          {inv.payment ? (
            <div className={`mt-3 rounded-lg p-4 text-sm ${inv.payment.outcome === "matched" ? "bg-emerald-50 text-emerald-900" : "bg-orange-50 text-orange-900"}`}>
              <b>{inv.payment.outcome === "matched" ? "Matched. Invoice settled." : inv.payment.outcome === "short" ? `Short paid by ${formatAed(Math.abs(inv.payment.difference))}. Follow up on the balance.` : `Overpaid by ${formatAed(inv.payment.difference)}. Refund or credit the difference.`}</b>
              <div className="mt-1 text-xs">Received {formatAed(inv.payment.amount)} on {new Date(inv.payment.paidAt).toLocaleDateString()} · ref <span className="font-mono">{inv.payment.reference}</span> · sample payment, no money moved</div>
            </div>
          ) : (
            <form
              className="mt-3 flex flex-wrap items-end gap-3"
              onSubmit={(e) => { e.preventDefault(); recordPayment(id, Number(amount), `PAY-${Date.now().toString(36).toUpperCase().slice(-5)}`); setPayAmount(null); }}
            >
              <label className="text-xs text-slate-600">Amount received (AED)
                <input className={`${field} mt-1 w-44`} type="number" step="0.01" value={amount} onChange={(e) => setPayAmount(e.target.value)} />
              </label>
              <button className={btnPrimary} type="submit">Record payment and match</button>
              <span className="text-xs text-slate-500">Try a lower amount to see a short-payment mismatch. This is sample data only.</span>
            </form>
          )}
        </section>
      )}

      {resp && (
        <section className={card}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">Provider response <SimTag>Simulated provider response</SimTag></h2>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{JSON.stringify(resp, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
