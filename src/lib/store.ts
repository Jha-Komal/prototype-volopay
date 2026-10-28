import { useSyncExternalStore } from "react";
import type {
  CheckResult,
  Fix,
  Invoice,
  ProviderResponse,
  Status,
  StatusEvent,
} from "./types";
import { seedInvoices } from "./seed";

const KEY = "volopay-einvoice-prototype-v1";

interface State {
  invoices: Invoice[];
}

const SERVER_STATE: State = { invoices: seedInvoices() };
let state: State = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.invoices)) state = parsed;
    }
  } catch {
    /* ignore a broken saved copy and keep the sample data */
  }
}

function set(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): State {
  load();
  return state;
}

function getServerSnapshot(): State {
  return SERVER_STATE;
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useInvoice(id: string): Invoice | undefined {
  return useStore().invoices.find((i) => i.id === id);
}

/** True once the browser copy has been read, so pages can avoid flashing sample data. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function evt(
  status: Status,
  message: string,
  source: StatusEvent["source"] = "volopay",
  code?: string,
): StatusEvent {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    status,
    source,
    message,
    ...(code ? { code } : {}),
  };
}

function update(id: string, fn: (inv: Invoice) => Invoice) {
  set({ invoices: state.invoices.map((i) => (i.id === id ? fn(i) : i)) });
}

export function acceptedNumbers(exceptId?: string): string[] {
  return state.invoices
    .filter((i) => i.status === "accepted" && i.id !== exceptId)
    .map((i) => i.number);
}

export function newInvoiceId(): string {
  return `inv-${Date.now().toString(36)}`;
}

/** Create or update an invoice. Any edit sends it back to draft so it has to be checked again. */
export function saveInvoice(next: Invoice, note = "Edited. Needs a new check.") {
  load();
  const exists = state.invoices.some((i) => i.id === next.id);
  if (!exists) {
    set({
      invoices: [
        {
          ...next,
          status: "draft",
          events: [evt("draft", "Draft created.")],
          lastCheck: undefined,
          providerResponse: undefined,
        },
        ...state.invoices,
      ],
    });
    return;
  }
  update(next.id, (prev) => ({
    ...next,
    status: "draft",
    lastCheck: undefined,
    providerResponse: undefined,
    events: [...prev.events, evt("draft", note)],
  }));
}

export async function runCheck(id: string): Promise<CheckResult | undefined> {
  load();
  const inv = state.invoices.find((i) => i.id === id);
  if (!inv) return;
  const res = await fetch("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice: inv, acceptedNumbers: acceptedNumbers(id) }),
  });
  const result = (await res.json()) as CheckResult;
  update(id, (prev) => ({
    ...prev,
    lastCheck: result,
    providerResponse: undefined,
    status: result.passed ? "checked" : "blocked",
    events: [
      ...prev.events,
      result.passed
        ? evt("checked", "All Volopay checks passed.")
        : evt(
            "blocked",
            `${result.issues.length} issue${result.issues.length === 1 ? "" : "s"} found. Not sent.`,
            "volopay",
            result.issues.map((i) => i.ruleId).filter((v, i, a) => a.indexOf(v) === i).join(", "),
          ),
    ],
  }));
  return result;
}

export async function submitInvoice(id: string): Promise<ProviderResponse | undefined> {
  load();
  const inv = state.invoices.find((i) => i.id === id);
  if (!inv || inv.status !== "checked") return;
  update(id, (prev) => ({
    ...prev,
    status: "submitted",
    providerResponse: undefined,
    events: [...prev.events, evt("submitted", "Sent to the simulated provider.")],
  }));
  const res = await fetch("/api/provider/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice: inv, acceptedNumbers: acceptedNumbers(id) }),
  });
  const response = (await res.json()) as ProviderResponse;
  update(id, (prev) => ({
    ...prev,
    status: response.status,
    providerResponse: response,
    events: [
      ...prev.events,
      response.status === "accepted"
        ? evt("accepted", `Accepted. Reference ${response.reference}.`, "simulated-provider")
        : evt("rejected", response.message ?? "Rejected.", "simulated-provider", response.code),
    ],
  }));
  return response;
}

function applyToInvoice(inv: Invoice, fix: Fix): Invoice {
  switch (fix.type) {
    case "setLineVat":
      return {
        ...inv,
        lines: inv.lines.map((l) =>
          l.id === fix.lineId ? { ...l, vatCode: fix.vatCode, vatRate: fix.vatRate } : l,
        ),
      };
    case "setLineRate":
      return {
        ...inv,
        lines: inv.lines.map((l) => (l.id === fix.lineId ? { ...l, vatRate: fix.vatRate } : l)),
      };
    case "setNumber":
      return { ...inv, number: fix.number };
    case "setBuyer":
      return { ...inv, buyer: { ...fix.buyer } };
  }
}

/** Apply a suggested fix. The invoice goes back to draft and must be checked again. */
export function applyFix(id: string, fix: Fix) {
  load();
  update(id, (prev) => ({
    ...applyToInvoice(prev, fix),
    status: "draft",
    lastCheck: undefined,
    providerResponse: undefined,
    events: [...prev.events, evt("draft", `Fix applied: ${fix.label}. Needs a new check.`)],
  }));
}

export function resetSampleData() {
  loaded = true;
  set({ invoices: seedInvoices() });
}
