import { Suspense } from "react";
import InvoiceDetail from "@/components/InvoiceDetail";

export default function Page({ params }: PageProps<"/invoices/[id]">) {
  return (
    <Suspense fallback={null}>
      <Inner params={params} />
    </Suspense>
  );
}

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
