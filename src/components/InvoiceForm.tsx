"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, Line, Party, VatCode } from "@/lib/types";
import { emptyLine, SELLER } from "@/lib/seed";
import { acceptedNumbers, newInvoiceId, saveInvoice, useInvoice } from "@/lib/store";
import { defaultRate, formatAed, invoiceTotals, lineNet, nextFreeNumber, runChecks, VAT_OPTIONS } from "@/lib/validate";
import { btnGhost, btnPrimary, card } from "./ui";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
const bad = "border-red-500 bg-red-50";

function blank(): Invoice {
  const nums = acceptedNumbers();
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return {
    id: newInvoiceId(),
    number: nextFreeNumber(nums),
    issueDate: today,
    dueDate: due,
    currency: "AED",
    seller: { ...SELLER },
    buyer: { name: "", trn: "", address: "" },
    lines: [emptyLine("l1")],
    status: "draft",
    events: [],
  };
}

export default function InvoiceForm({ id }: { id?: string }) {
  const existing = useInvoice(id ?? "");
  const router = useRouter();
  const [draft, setDraft] = useState<Invoice | null>(null);
  const inv = draft ?? existing ?? null;
  const [fresh] = useState(() => (id ? null : blank()));
  const current = inv ?? fresh;

  const issues = useMemo(
    () => (current ? runChecks(current, { acceptedNumbers: acceptedNumbers(current.id) }).issues : []),
    [current],
  );
  if (!current) return <p className="text-sm text-slate-500">Invoice not found.</p>;

  const byField = new Map(issues.map((i) => [i.field, i]));
  const err = (f: string) => byField.get(f);
  const set = (fn: (i: Invoice) => Invoice) => setDraft(fn(current));
  const party = (k: "seller" | "buyer", p: Partial<Party>) => set((i) => ({ ...i, [k]: { ...i[k], ...p } }));
  const line = (lid: string, p: Partial<Line>) =>
    set((i) => ({ ...i, lines: i.lines.map((l) => (l.id === lid ? { ...l, ...p } : l)) }));
  const totals = invoiceTotals(current);

  const msg = (f: string) => {
    const e = err(f);
    return e ? <p className="mt-0.5 text-xs text-red-700"><b>{e.ruleId}</b> {e.message}</p> : null;
  };

  function save() {
    if (!current) return;
    saveInvoice(current, "Edited. Needs a new check.");
    router.push(`/invoices/${current.id}`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{id ? `Edit ${current.number}` : "New invoice"}</h1>
      <p className="text-sm text-slate-600">
        Hints below update as you type (rules shown with their IDs). The authoritative check runs on the server when you press Check on the invoice page.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {(["seller", "buyer"] as const).map((k) => (
          <section key={k} className={card}>
            <h2 className="mb-3 text-sm font-semibold capitalize">{k}</h2>
            <label className="block text-xs text-slate-600">Name
              <input className={`${input} ${err(`${k}.name`) ? bad : ""}`} value={current[k].name} onChange={(e) => party(k, { name: e.target.value })} />
              {msg(`${k}.name`)}
            </label>
            <label className="mt-2 block text-xs text-slate-600">TRN (15 digits)
              <input className={`${input} font-mono ${err(`${k}.trn`) ? bad : ""}`} value={current[k].trn} onChange={(e) => party(k, { trn: e.target.value })} />
              {msg(`${k}.trn`)}
            </label>
            <label className="mt-2 block text-xs text-slate-600">Address
              <input className={`${input} ${err(`${k}.address`) ? bad : ""}`} value={current[k].address} onChange={(e) => party(k, { address: e.target.value })} />
              {msg(`${k}.address`)}
            </label>
          </section>
        ))}
      </div>

      <section className={`${card} grid gap-3 sm:grid-cols-4`}>
        <label className="text-xs text-slate-600">Invoice number
          <input className={`${input} font-mono ${err("number") ? bad : ""}`} value={current.number} onChange={(e) => set((i) => ({ ...i, number: e.target.value }))} />
          {msg("number")}
        </label>
        <label className="text-xs text-slate-600">Issue date
          <input type="date" className={`${input} ${err("issueDate") ? bad : ""}`} value={current.issueDate} onChange={(e) => set((i) => ({ ...i, issueDate: e.target.value }))} />
          {msg("issueDate")}
        </label>
        <label className="text-xs text-slate-600">Due date
          <input type="date" className={`${input} ${err("dueDate") ? bad : ""}`} value={current.dueDate} onChange={(e) => set((i) => ({ ...i, dueDate: e.target.value }))} />
          {msg("dueDate")}
        </label>
        <label className="text-xs text-slate-600">Currency
          <input className={`${input} bg-slate-100`} value="AED" readOnly />
        </label>
      </section>

      <section className={`${card} overflow-x-auto`}>
        <h2 className="mb-3 text-sm font-semibold">Lines</h2>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr><th>Description</th><th className="w-16">Qty</th><th className="w-20">Unit</th><th className="w-28">Unit price</th><th className="w-40">VAT category</th><th className="w-20">Rate %</th><th className="w-28 text-right">Net</th><th className="w-8" /></tr>
          </thead>
          <tbody>
            {current.lines.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="pr-2 pb-2">
                  <input className={`${input} ${err(`lines.${l.id}.description`) ? bad : ""}`} value={l.description} onChange={(e) => line(l.id, { description: e.target.value })} />
                  {msg(`lines.${l.id}.description`)}
                </td>
                <td className="pr-2"><input type="number" className={`${input} ${err(`lines.${l.id}.quantity`) ? bad : ""}`} value={l.quantity} onChange={(e) => line(l.id, { quantity: Number(e.target.value) })} />{msg(`lines.${l.id}.quantity`)}</td>
                <td className="pr-2"><input className={`${input} ${err(`lines.${l.id}.unit`) ? bad : ""}`} value={l.unit} onChange={(e) => line(l.id, { unit: e.target.value })} /></td>
                <td className="pr-2"><input type="number" className={`${input} ${err(`lines.${l.id}.unitPrice`) ? bad : ""}`} value={l.unitPrice} onChange={(e) => line(l.id, { unitPrice: Number(e.target.value) })} />{msg(`lines.${l.id}.unitPrice`)}</td>
                <td className="pr-2">
                  <select className={`${input} ${err(`lines.${l.id}.vatCode`) ? bad : ""}`} value={l.vatCode} onChange={(e) => { const c = e.target.value as VatCode; line(l.id, { vatCode: c, vatRate: c ? defaultRate(c) : l.vatRate }); }}>
                    <option value="">Choose…</option>
                    {VAT_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {msg(`lines.${l.id}.vatCode`)}
                </td>
                <td className="pr-2"><input type="number" className={`${input} ${err(`lines.${l.id}.vatRate`) ? bad : ""}`} value={l.vatRate} onChange={(e) => line(l.id, { vatRate: Number(e.target.value) })} />{msg(`lines.${l.id}.vatRate`)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatAed(lineNet(l))}</td>
                <td><button title="Remove line" className="px-1 text-slate-400 hover:text-red-600" onClick={() => set((i) => ({ ...i, lines: i.lines.filter((x) => x.id !== l.id) }))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {msg("lines")}
        <button className={`${btnGhost} mt-2`} onClick={() => set((i) => ({ ...i, lines: [...i.lines, emptyLine(`l${Date.now().toString(36)}`)] }))}>Add line</button>
        <dl className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Net</dt><dd className="tabular-nums">{formatAed(totals.net)}</dd></div>
          <div className="flex justify-between"><dt>VAT</dt><dd className="tabular-nums">{formatAed(totals.vat)}</dd></div>
          <div className="flex justify-between border-t pt-1 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatAed(totals.gross)}</dd></div>
        </dl>
      </section>

      <div className="flex items-center gap-3">
        <button className={btnPrimary} onClick={save}>Save draft</button>
        <button className={btnGhost} onClick={() => router.back()}>Cancel</button>
        <span className="text-xs text-slate-500">{issues.length ? `${issues.length} hint${issues.length === 1 ? "" : "s"} to resolve before it can be sent` : "No issues found locally"}</span>
      </div>
    </div>
  );
}
