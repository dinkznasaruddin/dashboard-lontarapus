import Link from "next/link";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export function PlaceholderPage({
  title,
  description,
  backTo,
  backLabel = "← Kembali ke Dashboard",
}: {
  title: string;
  description: string;
  backTo: string;
  backLabel?: string;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        action={
          <Link href={backTo} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            {backLabel}
          </Link>
        }
      />
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Construction className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-700">{title}</h2>
        <p className="mt-1 max-w-md px-6 text-sm text-slate-500">{description}</p>
        <p className="mt-3 text-xs text-slate-400">
          Halaman ini akan disiapkan pada tahap berikutnya (migrasi bertahap dari sistem lama).
        </p>
      </div>
    </div>
  );
}