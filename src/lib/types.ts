export type VatCode = "" | "S" | "Z" | "E";

export type Status =
  | "draft"
  | "blocked"
  | "checked"
  | "submitted"
  | "accepted"
  | "rejected";

export interface Party {
  name: string;
  trn: string;
  address: string;
}

export interface Line {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatCode: VatCode;
  vatRate: number;
}

export type Fix =
  | { type: "setLineVat"; lineId: string; vatCode: VatCode; vatRate: number; label: string }
  | { type: "setLineRate"; lineId: string; vatRate: number; label: string }
  | { type: "setNumber"; number: string; label: string }
  | { type: "setBuyer"; buyer: Party; label: string };

export interface CheckIssue {
  ruleId: string;
  field: string;
  message: string;
  fix?: Fix;
}

export interface CheckResult {
  passed: boolean;
  issues: CheckIssue[];
  checkedAt: string;
}

export interface StatusEvent {
  id: string;
  at: string;
  status: Status;
  source: "volopay" | "simulated-provider";
  code?: string;
  message: string;
}

export interface ProviderResponse {
  simulated: true;
  status: "accepted" | "rejected";
  reference?: string;
  code?: string;
  message?: string;
  suggestion?: Fix;
  receivedAt: string;
  respondedAt: string;
}

export interface Payment {
  amount: number;
  paidAt: string;
  reference: string;
  /** Result of matching the payment against the invoice total. */
  outcome: "matched" | "short" | "over";
  difference: number;
}

export interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: "AED";
  seller: Party;
  buyer: Party;
  lines: Line[];
  status: Status;
  events: StatusEvent[];
  lastCheck?: CheckResult;
  providerResponse?: ProviderResponse;
  payment?: Payment;
  /** Where the invoice came from, shown in the UI. */
  origin?: "manual" | "csv-import";
}

export interface PurchaseOrder {
  number: string;
  supplierTrn: string;
  supplierName: string;
  amount: number;
}

export interface MatchCheck {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface IncomingInvoice {
  id: string;
  number: string;
  receivedAt: string;
  supplier: Party;
  poNumber: string;
  description: string;
  net: number;
  vat: number;
  status: "received" | "approved" | "rejected";
  decisionNote?: string;
}

export interface CheckContext {
  /** Numbers of invoices already accepted inside this app (all sellers share one list in the demo). */
  acceptedNumbers: string[];
}
