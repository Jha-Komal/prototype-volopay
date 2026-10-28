import type { Invoice, Line, Party } from "./types";

/** All companies, addresses and tax numbers below are fictional. */
export const SELLER: Party = {
  name: "Example Trading LLC",
  trn: "100200300400003",
  address: "Office 12, Example Tower, Dubai, UAE",
};

const BUYER_A: Party = {
  name: "Sample Supplies FZE",
  trn: "100500600700003",
  address: "Unit 4, Sample Free Zone, Sharjah, UAE",
};

const BUYER_B: Party = {
  name: "Demo Retail LLC",
  trn: "100800900100003",
  address: "Shop 7, Demo Mall, Abu Dhabi, UAE",
};

const BUYER_UNREGISTERED: Party = {
  name: "Test Buyer LLC",
  trn: "100999999999003",
  address: "Tower 3, Test Street, Dubai, UAE",
};

function line(
  id: string,
  description: string,
  quantity: number,
  unitPrice: number,
  vatCode: Line["vatCode"],
  vatRate: number,
  unit = "Each",
): Line {
  return { id, description, quantity, unit, unitPrice, vatCode, vatRate };
}

function base(
  id: string,
  number: string,
  buyer: Party,
  lines: Line[],
): Invoice {
  return {
    id,
    number,
    issueDate: "2026-10-28",
    dueDate: "2026-11-27",
    currency: "AED",
    seller: { ...SELLER },
    buyer: { ...buyer },
    lines,
    status: "draft",
    events: [
      {
        id: `${id}-e0`,
        at: "2026-10-28T09:00:00.000Z",
        status: "draft",
        source: "volopay",
        message: "Draft created (sample data).",
      },
    ],
  };
}

export const SCENARIOS: { id: string; title: string; blurb: string }[] = [
  { id: "inv-1001", title: "INV-1001: the happy path", blurb: "Clean invoice. Check it, submit it, watch it get accepted." },
  { id: "inv-1002", title: "INV-1002: caught before sending", blurb: "Buyer TRN is one digit short. Volopay blocks it and offers a fix." },
  { id: "inv-1003", title: "INV-1003: wrong VAT", blurb: "One line has no VAT category and a zero-rated line carries 5%." },
  { id: "inv-1004", title: "INV-0999: rejected by the provider", blurb: "Passes our checks, but the provider already holds this number." },
  { id: "inv-1005", title: "INV-1005: buyer not on the network", blurb: "Passes our checks, but the provider cannot find the buyer." },
];

export function seedInvoices(): Invoice[] {
  return [
    base("inv-1001", "INV-1001", BUYER_A, [
      line("l1", "Consulting services", 10, 250, "S", 5, "Hour"),
      line("l2", "Software licence", 2, 1200, "S", 5),
    ]),
    base("inv-1002", "INV-1002", { ...BUYER_A, trn: "10050060070003" }, [
      line("l1", "Consulting services", 5, 300, "S", 5, "Hour"),
    ]),
    base("inv-1003", "INV-1003", BUYER_B, [
      line("l1", "Export freight", 3, 800, "Z", 5),
      line("l2", "Packaging", 20, 15, "", 5),
    ]),
    base("inv-1004", "INV-0999", BUYER_B, [
      line("l1", "Training course", 4, 900, "S", 5),
    ]),
    base("inv-1005", "INV-1005", BUYER_UNREGISTERED, [
      line("l1", "Equipment rental", 2, 1500, "S", 5),
    ]),
  ];
}

export function emptyLine(id: string): Line {
  return { id, description: "", quantity: 1, unit: "Each", unitPrice: 0, vatCode: "", vatRate: 5 };
}
