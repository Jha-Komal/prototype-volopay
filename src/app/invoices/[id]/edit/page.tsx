import { Suspense } from "react";
import EditInvoice from "@/components/EditInvoice";

export default function Page({ params }: PageProps<"/invoices/[id]/edit">) {
  return (
    <Suspense fallback={null}>
      <Inner params={params} />
    </Suspense>
  );
}

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditInvoice id={id} />;
}
