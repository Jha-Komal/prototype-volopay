import type { Fix, Invoice, Party, ProviderResponse } from "./types";
import { nextFreeNumber } from "./validate";

/**
 * SIMULATED e-invoicing provider. Nothing here connects to a real provider or tax authority.
 * The rules below are invented for the demo (rules P-01 to P-03 in the README).
 */

/** Numbers the simulated provider already holds, for example issued earlier through another tool. */
export const PROVIDER_REGISTRY = ["INV-0998", "INV-0999"];

/** Buyer TRNs the simulated provider does not know. All numbers are fictional. */
export const UNREGISTERED_BUYER_TRNS = ["100999999999003"];

/** A fictional registered buyer offered as the fix for BUYER_NOT_FOUND. */
export const REGISTERED_ALTERNATIVE: Party = {
  name: "Demo Retail LLC",
  trn: "100800900100003",
  address: "Shop 7, Demo Mall, Abu Dhabi, UAE",
};

export interface Adapter {
  submit(invoice: Invoice, acceptedNumbers: string[]): Promise<ProviderResponse>;
}

export function evaluateSubmission(
  invoice: Invoice,
  acceptedNumbers: string[],
  receivedAt: string,
): ProviderResponse {
  const base = { simulated: true as const, receivedAt, respondedAt: new Date().toISOString() };
  const number = invoice.number.trim();

  if (PROVIDER_REGISTRY.includes(number) || acceptedNumbers.includes(number)) {
    const free = nextFreeNumber([...PROVIDER_REGISTRY, ...acceptedNumbers]);
    const suggestion: Fix = { type: "setNumber", number: free, label: `Use ${free}` };
    return {
      ...base,
      status: "rejected",
      code: "DUPLICATE_INVOICE",
      message: `The provider already holds invoice number ${number} for this seller.`,
      suggestion,
    };
  }

  if (UNREGISTERED_BUYER_TRNS.includes(invoice.buyer.trn.trim())) {
    return {
      ...base,
      status: "rejected",
      code: "BUYER_NOT_FOUND",
      message: `Buyer TRN ${invoice.buyer.trn} is not registered on the network.`,
      suggestion: {
        type: "setBuyer",
        buyer: REGISTERED_ALTERNATIVE,
        label: `Use ${REGISTERED_ALTERNATIVE.name} (registered)`,
      },
    };
  }

  const ref = "SIM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  return { ...base, status: "accepted", reference: ref };
}
