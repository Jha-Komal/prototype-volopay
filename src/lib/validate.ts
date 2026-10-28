import type {
  CheckContext,
  CheckIssue,
  CheckResult,
  Invoice,
  Line,
  VatCode,
} from "./types";

export const TRN_LENGTH = 15;
export const NUMBER_FORMAT = /^INV-\d{4}$/;

export const VAT_OPTIONS: { code: VatCode; label: string; rate: number }[] = [
  { code: "S", label: "Standard (5%)", rate: 5 },
  { code: "Z", label: "Zero-rated (0%)", rate: 0 },
  { code: "E", label: "Exempt (0%)", rate: 0 },
];

export function defaultRate(code: VatCode): number {
  return VAT_OPTIONS.find((o) => o.code === code)?.rate ?? 5;
}

export function lineNet(l: Line): number {
  return round2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
}

export function lineVat(l: Line): number {
  return round2((lineNet(l) * (Number(l.vatRate) || 0)) / 100);
}

export function invoiceTotals(inv: Pick<Invoice, "lines">) {
  const net = round2(inv.lines.reduce((s, l) => s + lineNet(l), 0));
  const vat = round2(inv.lines.reduce((s, l) => s + lineVat(l), 0));
  return { net, vat, gross: round2(net + vat) };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatAed(n: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(n);
}

export function nextFreeNumber(used: string[]): string {
  const nums = used
    .map((n) => /^INV-(\d+)$/.exec(n))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `INV-${String(next).padStart(4, "0")}`;
}

function trnIssue(
  who: "Seller" | "Buyer",
  field: string,
  trn: string,
): CheckIssue | null {
  const t = trn.trim();
  if (!t) {
    return { ruleId: "V-01", field, message: `${who} TRN is missing.` };
  }
  if (!/^\d+$/.test(t)) {
    return { ruleId: "V-01", field, message: `${who} TRN must be digits only.` };
  }
  if (t.length !== TRN_LENGTH) {
    return {
      ruleId: "V-01",
      field,
      message: `${who} TRN has ${t.length} digits. A TRN has ${TRN_LENGTH}.`,
    };
  }
  return null;
}

/** Volopay's checks. Runs in the browser for live feedback and in the API as the authoritative pass. */
export function runChecks(inv: Invoice, ctx: CheckContext): CheckResult {
  const issues: CheckIssue[] = [];

  // V-01 TRNs
  const sellerTrn = trnIssue("Seller", "seller.trn", inv.seller.trn);
  if (sellerTrn) issues.push(sellerTrn);
  const buyerTrn = trnIssue("Buyer", "buyer.trn", inv.buyer.trn);
  if (buyerTrn) issues.push(buyerTrn);

  // V-05 required fields
  const required: [string, string, string][] = [
    ["seller.name", inv.seller.name, "Seller name is required."],
    ["seller.address", inv.seller.address, "Seller address is required."],
    ["buyer.name", inv.buyer.name, "Buyer name is required."],
    ["buyer.address", inv.buyer.address, "Buyer address is required."],
    ["issueDate", inv.issueDate, "Issue date is required."],
    ["dueDate", inv.dueDate, "Due date is required."],
  ];
  for (const [field, value, message] of required) {
    if (!String(value).trim()) issues.push({ ruleId: "V-05", field, message });
  }
  if (inv.issueDate && inv.dueDate && inv.dueDate < inv.issueDate) {
    issues.push({
      ruleId: "V-05",
      field: "dueDate",
      message: "Due date is before the issue date.",
    });
  }
  if (inv.lines.length === 0) {
    issues.push({ ruleId: "V-05", field: "lines", message: "Add at least one line." });
  }

  inv.lines.forEach((l, i) => {
    const n = i + 1;
    if (!l.description.trim()) {
      issues.push({ ruleId: "V-05", field: `lines.${l.id}.description`, message: `Line ${n} needs a description.` });
    }
    if (!(Number(l.quantity) > 0)) {
      issues.push({ ruleId: "V-05", field: `lines.${l.id}.quantity`, message: `Line ${n} needs a quantity above zero.` });
    }
    if (!(Number(l.unitPrice) > 0)) {
      issues.push({ ruleId: "V-05", field: `lines.${l.id}.unitPrice`, message: `Line ${n} needs a unit price above zero.` });
    }
    if (!l.unit.trim()) {
      issues.push({ ruleId: "V-05", field: `lines.${l.id}.unit`, message: `Line ${n} needs a unit of measure.` });
    }

    // V-02 VAT category per line
    if (!l.vatCode) {
      issues.push({
        ruleId: "V-02",
        field: `lines.${l.id}.vatCode`,
        message: `Line ${n} has no VAT category.`,
        fix: {
          type: "setLineVat",
          lineId: l.id,
          vatCode: "S",
          vatRate: 5,
          label: `Set line ${n} to Standard (5%)`,
        },
      });
      return;
    }

    // V-03 rate matches category
    const expected = defaultRate(l.vatCode);
    if (Number(l.vatRate) !== expected) {
      const name = VAT_OPTIONS.find((o) => o.code === l.vatCode)?.label.split(" ")[0];
      issues.push({
        ruleId: "V-03",
        field: `lines.${l.id}.vatRate`,
        message: `Line ${n} is ${name?.toLowerCase()} but carries ${l.vatRate}%. It should carry ${expected}%.`,
        fix: {
          type: "setLineRate",
          lineId: l.id,
          vatRate: expected,
          label: `Set line ${n} rate to ${expected}%`,
        },
      });
    }
  });

  // V-04 number format and uniqueness against accepted invoices in the app
  if (!NUMBER_FORMAT.test(inv.number.trim())) {
    issues.push({
      ruleId: "V-04",
      field: "number",
      message: "Invoice number should look like INV-1234.",
    });
  } else if (ctx.acceptedNumbers.includes(inv.number.trim())) {
    issues.push({
      ruleId: "V-04",
      field: "number",
      message: `${inv.number} is already used by an accepted invoice.`,
      fix: {
        type: "setNumber",
        number: nextFreeNumber(ctx.acceptedNumbers),
        label: `Use ${nextFreeNumber(ctx.acceptedNumbers)}`,
      },
    });
  }

  return { passed: issues.length === 0, issues, checkedAt: new Date().toISOString() };
}
