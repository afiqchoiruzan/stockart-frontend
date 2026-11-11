import { Suspense } from "react";

async function InvoiceContent({ params }) {
  const { id } = await params;
  return <div className="p-4">Invoice #{id}</div>;
}

export default function InvoicePage({ params }) {
  return (
    <Suspense fallback={<div className="p-4">Memuat...</div>}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}
