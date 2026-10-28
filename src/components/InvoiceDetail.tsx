"use client";

import Link from "next/link";
import { useState } from "react";
import { applyFix, runCheck, submitInvoice, useHydrated, useInvoice } from "@/lib/store";
import { formatAed, invoiceTotals, lineNet } from "@/lib/validate";
import type { Fix } from "@/lib/types";
import { RULES } from "@/lib/rules";
import { StatusChip, btnGhost, btnPrimary, card } from "@/components/ui";

const DOT: Record<string, string> = {
  draft: "bg-zinc-400", checked: "bg-sky-500", blocked: "bg-red-500",
  submitted: "bg-violet-500", accepted: "bg-emerald-500", rejected: "bg-orange-500",
};

export default function InvoiceDetail({ id }: { id: string }) {
  const inv = useInvoice(id);
  const hydrated = useHydrated();
  const [busy, setBusy] = useState<"check" | "submit" | null>(null);

  if (!hydrated) return null;
  if (!inv) {
    return <p className="text-sm">Invoice not found. <Link className="text-blue-700 underline" href="/">Back to invoices</Link></p>;
  }
  const totals = invoiceTotals(inv);
  const canEdit = inv.status !== "submitted" && inv.status !== "accepted";

  async function check() { setBusy("check"); await runCheck(id); setBusy(null); }
  async function submit() { setBusy("submit"); await submitInvoice(id); setBusy(null); }
  async function fix(f: Fix) { applyFix(id, f); await check(); }

  const issues = inv.status === "blocked" ? inv.lastCheck?.issues ?? [] : [];
  const resp = inv.providerResponse;
  const rejected = inv.status === "rejected" && resp;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-blue-700 hover:underline">← Invoices</Link>
        <h1 className="text-xl font-semibold">{inv.number}</h1>
        <StatusChip status={inv.status} />
        <div className="ml-auto flex gap-2">
          {canEdit && <Link href={`/invoices/${inv.id}/edit`} className={btnGhost}>Edit</Link>}
          <button className={btnGhost} disabled={busy !== null || inv.status === "submitted" || inv.status === "accepted"} onClick={check}>
            {busy === "check" ? "Checking…" : "Check"}
          </button>
          <button className={btnPrimary} disabled={busy !== null || inv.status !== "checked"} onClick={submit}
            title={inv.status === "checked" ? "" : "Submit unlocks once the checks pass"}>
            {busy === "submit" || inv.status === "submitted" ? "Waiting for simulated provider…" : "Submit to simulated provider"}
          </button>
        </div>
      </div>

      {inv.status === "draft" && <p className="rounded-md bg-zinc-100 p-3 text-sm">This draft has not been checked. Press <b>Check</b> to run Volopay&apos;s checks. Submit stays disabled until they pass.</p>}
      {inv.status === "checked" && <p className="rounded-md bg-sky-50 p-3 text-sm text-sky-900">All Volopay checks passed. You can now submit to the simulated provider.</p>}
      {inv.status === "accepted" && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">Accepted by the <b>simulated</b> provider. Reference <span className="font-mono">{resp?.reference}</span>.</p>}

      {issues.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-900">Blocked by Volopay checks. Nothing was sent.</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {issues.map((i, n) => (
              <li key={n} className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-red-200 px-1.5 py-0.5 font-mono text-xs text-red-900">{i.ruleId}</span>
                <span>{i.message}</span>
                <span className="text-xs text-red-800/70">Field: <code>{i.field}</code></span>
                {i.fix && <button className={`${btnGhost} !py-1 text-xs`} disabled={busy !== null} onClick={() => fix(i.fix!)}>{i.fix.label}</button>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-900/80">Fix the fields with <Link className="underline" href={`/invoices/${inv.id}/edit`}>Edit</Link>, or apply a suggested fix. Applying a fix re-runs the check automatically.</p>
        </section>
      )}

      {rejected && (
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h2 className="text-sm font-semibold text-orange-900">Rejected by the simulated provider: <span className="font-mono">{resp.code}</span></h2>
          <p className="mt-1 text-sm">{resp.message}</p>
          {resp.suggestion && (
            <button className={`${btnPrimary} mt-3`} disabled={busy !== null} onClick={() => fix(resp.suggestion!)}>
              Fix and resubmit: {resp.suggestion.label}
            </button>
          )}
          <p className="mt-2 text-xs text-orange-900/80">The fix sends the invoice back to draft and re-checks it. Then press Submit again.</p>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-5">
        <section className={`${card} md:col-span-3`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(["seller", "buyer"] as const).map((k) => (
              <div key={k}>
                <div className="text-xs uppercase text-zinc-500">{k}</div>
                <div className="font-medium">{inv[k].name}</div>
                <div className="font-mono text-xs">TRN {inv[k].trn || "—"}</div>
                <div className="text-xs text-zinc-600">{inv[k].address}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-zinc-600">Issued {inv.issueDate} · Due {inv.dueDate} · {inv.currency}</div>
          <table className="mt-3 w-full text-sm">
            <thead className="border-b text-left text-xs text-zinc-500"><tr><th className="py-1">Description</th><th>Qty</th><th>Price</th><th>VAT</th><th className="text-right">Net</th></tr></thead>
            <tbody>
              {inv.lines.map((l) => (
                <tr key={l.id} className="border-b border-zinc-100">
                  <td className="py-1.5">{l.description}</td>
                  <td>{l.quantity} {l.unit}</td>
                  <td className="tabular-nums">{l.unitPrice}</td>
                  <td>{l.vatCode ? `${l.vatCode} · ${l.vatRate}%` : <span className="text-red-700">none</span>}</td>
                  <td className="text-right tabular-nums">{formatAed(lineNet(l))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 ml-auto w-56 space-y-0.5 text-sm">
            <div className="flex justify-between"><dt>Net</dt><dd className="tabular-nums">{formatAed(totals.net)}</dd></div>
            <div className="flex justify-between"><dt>VAT</dt><dd className="tabular-nums">{formatAed(totals.vat)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatAed(totals.gross)}</dd></div>
          </dl>
        </section>

        <section className={`${card} md:col-span-2`}>
          <h2 className="mb-3 text-sm font-semibold">Status timeline</h2>
          <ol className="space-y-3">
            {[...inv.events].map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[e.status]}`} />
                <div>
                  <div className="font-medium capitalize">{e.status}{e.code ? <span className="ml-2 font-mono text-xs text-zinc-500">{e.code}</span> : null}</div>
                  <div className="text-zinc-700">{e.message}</div>
                  <div className="text-xs text-zinc-500">{new Date(e.at).toLocaleString()} · {e.source === "simulated-provider" ? "Simulated provider" : "Volopay"}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {resp && (
        <section className={card}>
          <h2 className="mb-2 text-sm font-semibold">Simulated provider response <span className="ml-1 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-950">SIMULATED</span></h2>
          <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">{JSON.stringify(resp, null, 2)}</pre>
        </section>
      )}

      {inv.lastCheck && (
        <p className="text-xs text-zinc-500">
          Last check ran on the server at {new Date(inv.lastCheck.checkedAt).toLocaleTimeString()}. Rules: {RULES.filter((r) => r.layer === "Volopay check").map((r) => r.id).join(", ")}. <Link className="underline" href="/rules">See the rules panel</Link>.
        </p>
      )}
    </div>
  );
}
