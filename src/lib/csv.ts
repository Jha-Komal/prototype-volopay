import type { Invoice, Line, VatCode } from "./types";
import { SELLER } from "./seed";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const COLUMNS = [
  "invoice_number", "issue_date", "due_date", "buyer_name", "buyer_trn", "buyer_address",
  "description", "quantity", "unit", "unit_price", "vat_code", "vat_rate",
];

/** Turn rows from a mock accounting-tool export into draft invoices, one per invoice_number. */
export function csvToInvoices(text: string): { invoices: Invoice[]; error?: string } {
  const rows = parseCsv(text);
  if (rows.length < 2) return { invoices: [], error: "The file needs a header row and at least one line." };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = COLUMNS.filter((c) => !head.includes(c));
  if (missing.length) return { invoices: [], error: `Missing columns: ${missing.join(", ")}` };
  const col = (r: string[], n: string) => (r[head.indexOf(n)] ?? "").trim();
  const map = new Map<string, Invoice>();
  const stamp = Date.now().toString(36);
  rows.slice(1).forEach((r, idx) => {
    const num = col(r, "invoice_number");
    let inv = map.get(num);
    if (!inv) {
      inv = {
        id: `inv-csv-${stamp}-${map.size}`,
        number: num,
        issueDate: col(r, "issue_date"),
        dueDate: col(r, "due_date"),
        currency: "AED",
        seller: { ...SELLER },
        buyer: { name: col(r, "buyer_name"), trn: col(r, "buyer_trn"), address: col(r, "buyer_address") },
        lines: [],
        status: "draft",
        origin: "csv-import",
        events: [{
          id: `csv-${stamp}-${map.size}`,
          at: new Date().toISOString(),
          status: "draft",
          source: "volopay",
          message: "Imported from a mock accounting-tool CSV export (simulated ERP link).",
        }],
      };
      map.set(num, inv);
    }
    const line: Line = {
      id: `l${idx + 1}`,
      description: col(r, "description"),
      quantity: Number(col(r, "quantity")) || 0,
      unit: col(r, "unit"),
      unitPrice: Number(col(r, "unit_price")) || 0,
      vatCode: col(r, "vat_code").toUpperCase() as VatCode,
      vatRate: col(r, "vat_rate") === "" ? 5 : Number(col(r, "vat_rate")),
    };
    inv.lines.push(line);
  });
  return { invoices: [...map.values()] };
}
