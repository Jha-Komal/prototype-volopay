import { runChecks } from "@/lib/validate";
import type { CheckContext, Invoice } from "@/lib/types";

/** Volopay's authoritative checks, run on the server before anything is sent. */
export async function POST(request: Request) {
  const body = (await request.json()) as { invoice?: Invoice; acceptedNumbers?: string[] };
  if (!body.invoice) {
    return Response.json({ error: "invoice is required" }, { status: 400 });
  }
  const ctx: CheckContext = { acceptedNumbers: body.acceptedNumbers ?? [] };
  await new Promise((r) => setTimeout(r, 450));
  return Response.json(runChecks(body.invoice, ctx));
}
