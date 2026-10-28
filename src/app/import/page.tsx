"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { csvToInvoices } from "@/lib/csv";
import { SAMPLE_CSV } from "@/lib/seed";
import { addImported, useHydrated } from "@/lib/store";
import { formatAed, invoiceTotals } from "@/lib/validate";
import { SimTag, btnGhost, btnPrimary, card } from "@/components/ui";

export default function ImportPage() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <ImportForm />;
}

function ImportForm() {
  const router = useRouter();
  const [text, setText] = useState(SAMPLE_CSV);
  const { invoices, error } = useMemo(() => csvToInvoices(text), [text]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import from accounting tool <SimTag>Mock CSV</SimTag></h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Stands in for an ERP or accounting connector. Paste or upload a CSV in the format below. Lines with the same invoice number become one draft invoice. Imported drafts then go through the same checks as any other invoice. The second sample invoice has a short buyer TRN and a line with no VAT category, so it will be blocked.
        </p>
      </div>

      <section className={card}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className={`${btnGhost} cursor-pointer`}>
            Upload a CSV file
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
          </label>
          <button className={btnGhost} onClick={() => setText(SAMPLE_CSV)}>Load sample</button>
        </div>
        <textarea
          aria-label="CSV contents"
          className="h-40 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold">Preview</h2>
        {error ? (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {invoices.map((i) => (
                <li key={i.id} className="flex flex-wrap gap-x-4 py-2">
                  <span className="font-medium">{i.number}</span>
                  <span>{i.buyer.name}</span>
                  <span className="text-slate-600">{i.lines.length} line{i.lines.length === 1 ? "" : "s"}</span>
                  <span className="ml-auto tabular-nums">{formatAed(invoiceTotals(i).gross)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <button className={btnPrimary} disabled={invoices.length === 0}
                onClick={() => { addImported(invoices); router.push("/"); }}>
                Import {invoices.length} draft invoice{invoices.length === 1 ? "" : "s"}
              </button>
              <Link href="/" className="text-sm text-slate-600 underline">Cancel</Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
