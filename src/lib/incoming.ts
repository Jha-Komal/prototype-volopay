import type { IncomingInvoice, MatchCheck } from "./types";
import { PURCHASE_ORDERS } from "./seed";
import { TRN_LENGTH, formatAed, round2 } from "./validate";

/** Assumed matching rules for the receive side. Invented for the demo, not an official standard. */
export function matchIncoming(inv: IncomingInvoice): MatchCheck[] {
  const total = round2(inv.net + inv.vat);
  const po = PURCHASE_ORDERS.find((p) => p.number === inv.poNumber);
  const known = PURCHASE_ORDERS.some((p) => p.supplierTrn === inv.supplier.trn);
  return [
    {
      id: "M-01",
      label: "Supplier TRN is well-formed",
      pass: /^\d+$/.test(inv.supplier.trn) && inv.supplier.trn.length === TRN_LENGTH,
      detail: `${inv.supplier.trn.length} digits`,
    },
    {
      id: "M-02",
      label: "Supplier is on the approved supplier list",
      pass: known,
      detail: known ? "Known supplier" : "Not in the approved supplier list",
    },
    {
      id: "M-03",
      label: "Purchase order exists and belongs to this supplier",
      pass: !!po && po.supplierTrn === inv.supplier.trn,
      detail: po ? `${po.number} is for ${po.supplierName}` : `${inv.poNumber} was not found`,
    },
    {
      id: "M-04",
      label: "Invoice total is within the purchase order amount",
      pass: !!po && total <= po.amount,
      detail: po ? `Invoice ${formatAed(total)} vs PO ${formatAed(po.amount)}` : "No PO to compare",
    },
    {
      id: "M-05",
      label: "VAT is 5% of net (assumed standard rate)",
      pass: round2(inv.net * 0.05) === inv.vat,
      detail: `Expected ${formatAed(round2(inv.net * 0.05))}, invoice shows ${formatAed(inv.vat)}`,
    },
  ];
}
