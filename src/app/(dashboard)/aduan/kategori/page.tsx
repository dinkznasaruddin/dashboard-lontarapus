import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { OpdChartCard } from "@/components/opd-chart";
import { SortSelect } from "@/components/sort-select";
import { AduanDetailButton } from "@/components/aduan-detail-button";
import { getAllAduan } from "@/lib/aduan-server";
import { buildKategoriData, type GroupedRow } from "@/lib/aduan";
import { Tags, ClipboardList, Clock, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Proses: "bg-amber-100 text-amber-700",
  Pending: "bg-sky-100 text-sky-700",
  Menunggu: "bg-slate-100 text-slate-600",
  Ditolak: "bg-red-100 text-red-700",
};

type SortKey =
  | "total_aduan_desc"
  | "total_aduan_asc"
  | "completion_time_asc"
  | "completion_time_desc"
  | "kategori_asc"
  | "kategori_desc";

function sortRows(rows: GroupedRow[], sort: SortKey): GroupedRow[] {
  const arr = [...rows];
  switch (sort) {
    case "total_aduan_asc":
      arr.sort((a, b) => a.total - b.total || a.completionCount - b.completionCount);
      break;
    case "completion_time_asc":
      arr.sort((a, b) => (a.avgCompletionMinutes ?? Infinity) - (b.avgCompletionMinutes ?? Infinity));
      break;
    case "completion_time_desc":
      arr.sort((a, b) => (b.avgCompletionMinutes ?? 0) - (a.avgCompletionMinutes ?? 0));
      break;
    case "kategori_asc":
      arr.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "kategori_desc":
      arr.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      arr.sort((a, b) => b.total - a.total || b.completionCount - a.completionCount);
  }
  return arr;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "total_aduan_desc", label: "Jumlah Aduan (Tertinggi ke Terendah)" },
  { value: "total_aduan_asc", label: "Jumlah Aduan (Terendah ke Tertinggi)" },
  { value: "completion_time_asc", label: "Rata-rata Penyelesaian (Tercepat ke Terlama)" },
  { value: "completion_time_desc", label: "Rata-rata Penyelesaian (Terlama ke Tercepat)" },
  { value: "kategori_asc", label: "Nama Kategori (A-Z)" },
  { value: "kategori_desc", label: "Nama Kategori (Z-A)" },
];

export default async function KategoriPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const all = await getAllAduan();
  const data = buildKategoriData(all);

  const sort = SORT_OPTIONS.some((o) => o.value === sp.sort)
    ? (sp.sort as SortKey)
    : "total_aduan_desc";
  const rows = sortRows(data.rows, sort);

  return (
    <div>
      <PageHeader
        title="Dashboard Aduan per Kategori"
        subtitle="Rekapitulasi aduan berdasarkan kategori dari workflow.digitalteam.id"
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Kategori" value={data.rows.length.toLocaleString("id-ID")} icon={Tags} tone="blue" />
        <StatCard title="Total Aduan" value={data.totalAduan.toLocaleString("id-ID")} icon={ClipboardList} tone="green" />
        <StatCard
          title="Rata-rata Waktu Penyelesaian"
          value={
            <span>
              {data.globalAvgCompletionTime}
              {data.globalCompletionCount > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({data.globalCompletionCount.toLocaleString("id-ID")} tiket)
                </span>
              )}
            </span>
          }
          icon={Clock}
          tone="amber"
        />
        <StatCard
          title="Kategori Tertinggi"
          value={
            <span className="block truncate" title={data.topName}>
              {data.topName === "--" ? "N/A" : data.topName.length > 20 ? data.topName.slice(0, 20) + "…" : data.topName}
              {data.topCount > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {data.topCount.toLocaleString("id-ID")} aduan
                </span>
              )}
            </span>
          }
          icon={Trophy}
          tone="red"
        />
      </div>

      {/* Chart */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Grafik Jumlah Aduan per Kategori" subtitle="Top 15 kategori berdasarkan filter" />
          <CardBody>
            <OpdChartCard byCount={data.chartByCount} fastest={data.chartFastest} slowest={data.chartSlowest} />
          </CardBody>
        </Card>
      </div>

      {/* Main table */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Data Aduan per Kategori" />
          <CardBody>
            <div className="mb-4">
              <SortSelect value={sort} options={SORT_OPTIONS} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Jumlah Aduan</th>
                    <th className="px-4 py-3">Status Aduan</th>
                    <th className="px-4 py-3 text-center">Rata-rata Waktu Penyelesaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={r.name} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="max-w-[260px] px-4 py-3 font-semibold text-slate-700">{r.name}</td>
                      <td className="px-4 py-3">
                        <AduanDetailButton type="kategori" name={r.name} label={`${r.total.toLocaleString("id-ID")} aduan`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(r.statusCounts)
                            .filter(([, c]) => c > 0)
                            .map(([status, count]) => (
                              <span
                                key={status}
                                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {status}: {count}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-blue-600">{r.avgCompletionTime}</span>
                        {r.completionCount > 0 && (
                          <div className="text-xs text-slate-400">({r.completionCount} selesai)</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}