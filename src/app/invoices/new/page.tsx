"use client";

import InvoiceForm from "@/components/InvoiceForm";
import { useHydrated } from "@/lib/store";

export default function NewInvoice() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <InvoiceForm />;
}
