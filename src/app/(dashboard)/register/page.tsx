import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { fetchRegister } from "@/lib/apis";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { LineChartJS, DoughnutChartJS, BarChartJS } from "@/components/chartjs-charts";
import { ExcelExportButton } from "@/components/excel-export-button";
import { RegisterSkeleton } from "@/components/skeleton";
import { CalendarDays, CalendarRange, UserCheck, Users, RefreshCw } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const TARGET_KELURAHAN = 153;

interface MonthItem {
  year: string;
  month: string;
  total: number;
}
interface NameTotalItem {
  subDistrictName?: string;
  villageName?: string;
  total: number;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent yearParam={sp.year} pageParam={sp.page} />
    </Suspense>
  );
}

async function RegisterContent({
  yearParam,
  pageParam,
}: {
  yearParam?: string;
  pageParam?: string;
}) {
  const currentYear = new Date().getFullYear();
  const year = Math.min(currentYear, Math.max(2025, Number(yearParam) || currentYear));
  const PER_PAGE = 10;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  // Selalu ambil summary (tanpa tahun) untuk "Total Registrasi" semua tahun.
  const [summaryYear, summaryAll, monthly, bySub, byVillage] = await Promise.all([
    fetchRegister<any>("summary", { year: String(year) }).catch(() => null),
    fetchRegister<any>("summary", {}).catch(() => null),
    fetchRegister<any>("summary-by-registered-month", { year: String(year) }).catch(() => null),
    fetchRegister<any>("summary-by-subdistrict", { year: String(year) }).catch(() => null),
    fetchRegister<any>("summary-by-village", { year: String(year) }).catch(() => null),
  ]);

  const apiOk = !!(summaryYear && summaryYear.status);
  const d = summaryYear?.data ?? {};
  const dAll = summaryAll?.data ?? {};

  const today = d.today ?? 0;
  const month = d.month ?? 0;
  const yearTotal = d.total ?? 0;
  const totalAllYears = dAll.total ?? 0;

  // Data bulanan → isi 12 slot.
  const monthlyData = Array(12).fill(0) as number[];
  if (monthly && Array.isArray(monthly.data)) {
    for (const m of monthly.data as MonthItem[]) {
      const idx = Number(m.month) - 1;
      if (idx >= 0 && idx < 12) monthlyData[idx] = Number(m.total) || 0;
    }
  }

  // Kecamatan (buang item tanpa nama).
  const subDistrict = ((bySub?.data ?? []) as NameTotalItem[])
    .filter((i) => i.subDistrictName)
    .map((i) => ({ name: i.subDistrictName as string, total: Number(i.total) || 0 }))
    .sort((a, b) => b.total - a.total);

  // Kelurahan (buang item tanpa nama).
  const villages = ((byVillage?.data ?? []) as NameTotalItem[])
    .filter((i) => i.villageName)
    .map((i) => ({ name: i.villageName as string, sub: i.subDistrictName ?? "", total: Number(i.total) || 0 }))
    .sort((a, b) => b.total - a.total);

  const currentKelurahan = new Set(villages.filter((v) => v.total > 0).map((v) => v.name)).size;
  const missingKelurahan = Math.max(0, TARGET_KELURAHAN - currentKelurahan);
  const topVillages = villages.slice(0, 10);

  const tableData = villages
    .filter((v) => v.sub)
    .map((v) => ({ kelurahan: v.name, kecamatan: v.sub, jumlah: v.total }));

const yearOptions: number[] = [];
for (let y = currentYear; y >= 2025; y--) yearOptions.push(y);

// Pagination tabel per kelurahan.
const totalTable = tableData.length;
const totalPages = Math.max(1, Math.ceil(totalTable / PER_PAGE));
const page = Math.min(currentPage, totalPages);
const pageTable = tableData.slice((page - 1) * PER_PAGE, page * PER_PAGE);
const startRow = totalTable === 0 ? 0 : (page - 1) * PER_PAGE + 1;
const endRow = Math.min(page * PER_PAGE, totalTable);

function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("...");
    out.push(p);
    prev = p;
  }
  return out;
}

const filterQuery = (pageNum: number) => (year === currentYear ? `?page=${pageNum}` : `?year=${year}&page=${pageNum}`);

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Dashboard Monitoring Data Pendaftar
            <Badge color={apiOk ? "green" : "red"}>{apiOk ? "API Connected" : "API Error"}</Badge>
          </span>
        }
        subtitle="Data registrasi peserta dari API Lontara"
        action={
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Link>
        }
      />

      {/* Filter Tahun */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2" method="GET">
          <label className="text-sm font-medium text-slate-600">Tahun</label>
          <select
            name="year"
            defaultValue={year}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Registrasi Hari Ini" value={today.toLocaleString("id-ID")} icon={CalendarDays} tone="green" />
        <StatCard title="Bulan Ini" value={month.toLocaleString("id-ID")} icon={CalendarRange} tone="blue" />
        <StatCard title={`Registrasi Tahun ${year}`} value={yearTotal.toLocaleString("id-ID")} icon={UserCheck} tone="slate" />
        <StatCard title="Total Registrasi" value={totalAllYears.toLocaleString("id-ID")} icon={Users} tone="amber" />
      </div>

      {/* Charts Row 1 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Registrasi per Bulan" />
          <CardBody>
            <LineChartJS
              labels={MONTHS}
              label="Registrasi"
              values={monthlyData}
              color="#4e73df"
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Realisasi Kelurahan" />
          <CardBody>
            <DoughnutChartJS
              data={[
                { label: "Ada Register", value: currentKelurahan, color: "#1cc88a" },
                { label: "Belum Ada Register", value: missingKelurahan, color: "#e74a3b" },
              ]}
              height={300}
            />
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registrasi per Kecamatan" />
          <CardBody>
            {subDistrict.length > 0 ? (
              <BarChartJS
                labels={subDistrict.map((s) => s.name)}
                values={subDistrict.map((s) => s.total)}
                color="#1cc88a"
                height={320}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Tidak ada data kecamatan tersedia.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top 10 Kelurahan" />
          <CardBody>
            {topVillages.length > 0 ? (
              <BarChartJS
                labels={topVillages.map((v) => v.name)}
                values={topVillages.map((v) => v.total)}
                color="#f6c23e"
                height={280}
                horizontal
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Tidak ada data kelurahan tersedia.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tabel */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title="Data Registrasi per Kelurahan"
            action={<ExcelExportButton rows={tableData} />}
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">No.</th>
                    <th className="px-5 py-3">Nama Kelurahan</th>
                    <th className="px-5 py-3">Nama Kecamatan</th>
                    <th className="px-5 py-3 text-right">Jumlah Register</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageTable.map((r, i) => (
                    <tr key={r.kelurahan} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">{startRow + i}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{r.kelurahan}</td>
                      <td className="px-5 py-3 text-slate-600">{r.kecamatan}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">
                        {r.jumlah.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  {pageTable.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada data atau API error
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Menampilkan <strong>{startRow.toLocaleString("id-ID")}</strong>–
                <strong>{endRow.toLocaleString("id-ID")}</strong> dari{" "}
                <strong>{totalTable.toLocaleString("id-ID")}</strong> kelurahan
              </p>
              <nav className="flex items-center gap-1">
                <a
                  href={page > 1 ? filterQuery(page - 1) : "#"}
                  aria-disabled={page <= 1}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    page > 1 ? "text-slate-600 hover:bg-slate-100" : "pointer-events-none text-slate-300"
                  }`}
                >
                  « Prev
                </a>
                {pageRange(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-2 py-1.5 text-sm text-slate-400">
                      …
                    </span>
                  ) : (
                    <a
                      key={p}
                      href={filterQuery(p)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        p === page ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </a>
                  )
                )}
                <a
                  href={page < totalPages ? filterQuery(page + 1) : "#"}
                  aria-disabled={page >= totalPages}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    page < totalPages ? "text-slate-600 hover:bg-slate-100" : "pointer-events-none text-slate-300"
                  }`}
                >
                  Next »
                </a>
              </nav>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}