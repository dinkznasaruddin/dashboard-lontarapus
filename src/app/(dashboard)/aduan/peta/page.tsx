import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { AduanMap } from "@/components/aduan-map";
import { PetaFilter } from "@/components/peta-filter";
import { queryMapRows } from "@/lib/aduan-server";
import { buildMapFilterOptions, buildMapLocations } from "@/lib/aduan";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PetaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; kategori?: string; status?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const year = Number(sp.year) || undefined;
  const kategori = sp.kategori || undefined;
  const status = sp.status || undefined;

  // 1. Ambil SEMUA opsi filter (tanpa filter, dibatasi jumlah baris) —
  //    murah karena hanya butuh longlat/waktu/kategori/status.
  const filterSource = await queryMapRows({});
  const { years, kategori: kategoriOptions, status: statusOptions } =
    buildMapFilterOptions(filterSource);
  const selectedYear = year ?? years[0] ?? new Date().getFullYear();

  // 2. Ambil lokasi peta dengan filter yang dipilih — difilter di SQL,
  //    tidak perlu memuat seluruh 25k baris (~45MB).
  const rows = await queryMapRows({ year: selectedYear, kategori, status });
  const { locations } = buildMapLocations(rows);

  return (
    <div>
      <PageHeader
        title="Peta Sebaran Aduan"
        subtitle="Persebaran aduan berdasarkan koordinat dari workflow.digitalteam.id"
        action={
          <Link
            href="/aduan"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Aduan
          </Link>
        }
      />

      {/* Filter */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <PetaFilter
          year={selectedYear}
          kategori={sp.kategori ?? ""}
          status={sp.status ?? ""}
          years={years}
          kategoriOptions={kategoriOptions}
          statusOptions={statusOptions}
        />
      </div>

      {/* Map (full width, legenda stay di dalam peta) */}
      <Card>
        <CardHeader title={`Peta Sebaran Aduan - ${selectedYear}`} subtitle="Klik marker untuk melihat detail aduan" />
        <CardBody>
          <AduanMap locations={locations} />
        </CardBody>
      </Card>
    </div>
  );
}