import { evaluateSubmission } from "@/lib/provider";
import type { Invoice } from "@/lib/types";

/**
 * SIMULATED provider endpoint. It stands in for an accredited e-invoicing provider.
 * It waits a couple of seconds, then accepts or rejects using invented rules (P-01 to P-03).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { invoice?: Invoice; acceptedNumbers?: string[] };
  if (!body.invoice) {
    return Response.json({ error: "invoice is required" }, { status: 400 });
  }
  const receivedAt = new Date().toISOString();
  const delay = 1800 + Math.floor(Math.random() * 800);
  await new Promise((r) => setTimeout(r, delay));
  return Response.json(
    evaluateSubmission(body.invoice, body.acceptedNumbers ?? [], receivedAt),
  );
}
