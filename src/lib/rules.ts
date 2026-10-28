export type Basis = "sourced" | "assumed" | "simulated";

export interface Rule {
  id: string;
  layer: "Volopay check" | "Simulated provider" | "Incoming match";
  title: string;
  detail: string;
  basis: Basis;
  note: string;
  source?: { label: string; href: string };
}

const WEALTH =
  "https://thewealthtoday.com/uae-e-invoicing-is-now-an-execution-challenge-for-smes/";
const KPMG =
  "https://kpmg.com/us/en/taxnewsflash/news/2026/02/uae-technical-guidance-mandatory-e-invoicing-fields.html";
const WAFEQ =
  "https://www.wafeq.com/en-ae/tax-and-reporting/e-invoicing-readiness-checklist-for-smes-in-the-uae:-10-things-to-do-before-october-2026";

export const RULES: Rule[] = [
  {
    id: "V-01",
    layer: "Volopay check",
    title: "Tax registration numbers are present and well-formed",
    detail: "Seller and buyer TRN must be filled in and be 15 digits.",
    basis: "sourced",
    note: "Invalid TRNs are a named cause of rejections. The 15-digit length comes from secondary sources, not an official FTA page. The prefix is not checked because sources disagree on it.",
    source: { label: "The Wealth Today", href: WEALTH },
  },
  {
    id: "V-02",
    layer: "Volopay check",
    title: "Every line has a VAT category",
    detail: "VAT is set per line (Standard, Zero-rated or Exempt), not only once for the invoice.",
    basis: "sourced",
    note: "A UAE provider guide says the invoice format needs a tax code on each line.",
    source: { label: "Wafeq", href: WAFEQ },
  },
  {
    id: "V-03",
    layer: "Volopay check",
    title: "VAT rate matches the category",
    detail: "Standard is 5%. Zero-rated and Exempt carry 0%.",
    basis: "sourced",
    note: "Wrong VAT on zero-rated or mixed supplies is a named rejection cause. The 5% standard rate is from secondary sources. The exact zero-rated and exempt lists were not checked against the FTA.",
    source: { label: "The Wealth Today", href: WEALTH },
  },
  {
    id: "V-04",
    layer: "Volopay check",
    title: "Invoice number format and uniqueness",
    detail: "Format INV-0000. The number must not already be used by an accepted invoice in this app.",
    basis: "assumed",
    note: "Non-standard numbering and duplicates are named rejection causes. The exact format here is invented for the demo.",
    source: { label: "The Wealth Today", href: WEALTH },
  },
  {
    id: "V-05",
    layer: "Volopay check",
    title: "Required fields are filled",
    detail: "Names and addresses for both parties, issue and due dates, and per line: description, quantity, unit and price.",
    basis: "sourced",
    note: "The FTA guidance lists 51 mandatory fields in groups (invoice, seller, buyer, totals, tax breakdown, lines). This demo checks a small subset of them.",
    source: { label: "KPMG on the FTA guidance", href: KPMG },
  },
  {
    id: "P-01",
    layer: "Simulated provider",
    title: "Accept a valid submission",
    detail: "After a short delay the simulated provider returns Accepted with a fake reference.",
    basis: "simulated",
    note: "Invented for the demo. No real provider is connected.",
  },
  {
    id: "P-02",
    layer: "Simulated provider",
    title: "Reject a duplicate invoice number",
    detail: "Rejected with DUPLICATE_INVOICE if the provider already holds that number.",
    basis: "simulated",
    note: "Invented for the demo. It stands in for a number issued earlier through another tool.",
  },
  {
    id: "P-03",
    layer: "Simulated provider",
    title: "Reject a buyer not on the network",
    detail: "Rejected with BUYER_NOT_FOUND if the buyer TRN is not registered.",
    basis: "simulated",
    note: "Invented for the demo. A real provider would look the buyer up on its network.",
  },
  {
    id: "M-01 to M-05",
    layer: "Incoming match",
    title: "Match a received invoice to the supplier list and purchase order",
    detail: "Supplier TRN well-formed, supplier approved, PO exists for that supplier, total within PO amount, VAT is 5% of net.",
    basis: "assumed",
    note: "Invented for the demo to illustrate the receive side. Real matching policy would come from each customer's procurement rules.",
  },
]
