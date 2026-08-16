import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { PercentChange } from "@/components/summary-card";
import {
  MonthlyTrendChart,
  StatusDoughnut,
  DailyChart,
  KategoriBar,
  DurasiDoughnut,
  DurasiBar,
  type PieDatum,
} from "@/components/chartjs-charts";
import { AduanTable } from "@/components/aduan-table";
import { BarList } from "@/components/charts";
import { getAduanData, getAllAduan } from "@/lib/aduan-server";
import { monthlyForYear, dailyForMonth, BULAN_NAMES } from "@/lib/aduan";
import { MessagesSquare, CalendarDays, CalendarRange, ClipboardList } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Closed: "#28a745",
  Selesai: "#28a745",
  "In progress": "#ffc107",
  Proses: "#ffc107",
  Pending: "#17a2b8",
  Open: "#17a2b8",
  Ditolak: "#dc3545",
};
const STATUS_FALLBACK = "#6c757d";

const DURASI_FR_COLORS: Record<string, string> = {
  "≤ 1 Jam": "#28a745",
  "1-6 Jam": "#ffc107",
  "6-24 Jam": "#17a2b8",
  "> 24 Jam": "#dc3545",
  "Tidak Ada Data": "#6c757d",
};

const DURASI_PEN_COLORS: Record<string, string> = {
  "Belum Selesai": "#28a745",
  "≤ 8 Jam": "#1cc88a",
  "8-24 Jam": "#ffc107",
  "1-3 Hari": "#fd7e14",
  "> 3 Hari": "#17a2b8",
  "Tidak Ada Data": "#6c757d",
};

export default async function AduanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; year_daily?: string }>;
}) {
  await requireAuth();

  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [agg, all] = await Promise.all([getAduanData(), getAllAduan()]);

  const availableYears = agg.availableYears.length ? agg.availableYears : [currentYear];
  const year = Math.min(currentYear, Math.max(availableYears[availableYears.length - 1], Number(sp.year) || availableYears[0]));
  const selectedYearDaily = Math.min(currentYear, Math.max(2020, Number(sp.year_daily) || currentYear));
  const month = Math.min(12, Math.max(1, Number(sp.month) || currentMonth));

  const monthly = monthlyForYear(agg, all, year);
  const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const monthlyTotal = monthly.map((m) => m.total);
  const monthlySelesai = monthly.map((m) => m.selesai);
  const monthlyProses = monthly.map((m) => m.proses);

  const daily = dailyForMonth(agg, all, selectedYearDaily, month);
  const daysInMonth = new Date(selectedYearDaily, month, 0).getDate();
  const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  const isCurrentMonth = month === currentMonth && selectedYearDaily === currentYear;
  const currentDay = new Date().getDate();
  const daysForAvg = isCurrentMonth ? currentDay : daysInMonth;
  const totalDaily = daily.reduce((a, b) => a + b, 0);
  const avgDaily = daysForAvg > 0 ? totalDaily / daysForAvg : 0;
  const avgArray = (Array(daysInMonth).fill(avgDaily) as (number | null)[]);
  if (isCurrentMonth) {
    for (let i = currentDay; i < avgArray.length; i++) avgArray[i] = null;
  }

  const statusData: PieDatum[] = agg.statusCounts.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.label] ?? STATUS_FALLBACK,
  }));

  const durasiFRData: PieDatum[] = agg.durasiFirstReply.map((d) => ({
    label: d.label,
    value: d.value,
    color: DURASI_FR_COLORS[d.label] ?? "#858796",
  }));

  const durasiPenData = agg.durasiPenyelesaian;
  const durasiPenColors = durasiPenData.map((d) => DURASI_PEN_COLORS[d.label] ?? "#858796");

  const kategoriData = agg.kategoriCounts.slice(0, 15);

  const layananOptions = agg.layananStats.map((l) => ({ label: l.layanan, count: l.count }));

  return (
    <div>
      <PageHeader title="Dashboard Aduan" subtitle="Data aduan dari workflow.digitalteam.id" />

      {/* Filter */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2" action="" method="get">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year_daily" value={selectedYearDaily} />
          <label className="text-sm font-medium text-slate-600">Tahun</label>
          <select
            name="year"
            defaultValue={year}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Filter
          </button>
        </form>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aduan Hari Ini"
          value={
            <span className="flex items-center">
              {agg.hariIni.toLocaleString("id-ID")}
              <PercentChange current={agg.hariIni} previous={agg.kemarin} />
            </span>
          }
          icon={CalendarDays}
          tone="blue"
        />
        <StatCard
          title="Aduan Bulan Ini"
          value={
            <span className="flex items-center">
              {agg.bulanIni.toLocaleString("id-ID")}
              <PercentChange current={agg.bulanIni} previous={agg.bulanLalu} />
            </span>
          }
          icon={CalendarRange}
          tone="green"
        />
        <StatCard
          title="Aduan Tahun Ini"
          value={
            <span className="flex items-center">
              {agg.tahunIni.toLocaleString("id-ID")}
              <PercentChange current={agg.tahunIni} previous={agg.tahunLalu} />
            </span>
          }
          icon={MessagesSquare}
          tone="amber"
        />
        <StatCard
          title="Total Semua Aduan"
          value={agg.total.toLocaleString("id-ID")}
          icon={ClipboardList}
          tone="red"
        />
      </div>

      {/* Monthly + Status */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`Trend Aduan per Bulan - ${year}`} />
          <CardBody>
            <MonthlyTrendChart labels={monthlyLabels} total={monthlyTotal} selesai={monthlySelesai} proses={monthlyProses} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Distribusi Status" />
          <CardBody>
            <StatusDoughnut data={statusData} />
          </CardBody>
        </Card>
      </div>

      {/* Daily */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title={`Aduan Harian - ${BULAN_NAMES[month - 1]} ${selectedYearDaily}`}
            subtitle={`Rata-rata ${avgDaily.toFixed(1)} aduan/hari`}
          />
          <CardBody>
            <DailyChart labels={dailyLabels} values={daily} avgArray={avgArray} />
          </CardBody>
        </Card>
      </div>

      {/* Kategori */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Distribusi Kategori Aduan" />
          <CardBody>
            <KategoriBar labels={kategoriData.map((k) => k.label)} values={kategoriData.map((k) => k.value)} />
          </CardBody>
        </Card>
      </div>

      {/* Layanan + Kecamatan */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Statistik Performa Layanan" />
          <CardBody className="max-h-[420px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {agg.layananStats.map((l) => (
                <div key={l.layanan} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-1 flex items-start justify-between gap-2 text-sm">
                    <strong className="text-slate-700">{l.layanan}</strong>
                    <span className="shrink-0 text-xs text-slate-500">
                      {l.count.toLocaleString("id-ID")} aduan ({l.persen.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, l.persen)}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-blue-600">Rata² Reply Awal</div>
                      <div className="text-slate-800">{l.avgFirstReply}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-700">Rata² Respon OPD</div>
                      <div className="text-slate-800">{l.avgOpdResponse}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">Rata² Penyelesaian</div>
                      <div className="text-slate-800">{l.avgPenyelesaian}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Semua Kecamatan" />
          <CardBody className="max-h-[420px] overflow-y-auto">
            <BarList data={agg.kecamatanCounts} color="#4e73df" />
          </CardBody>
        </Card>
      </div>

      {/* Durasi */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Analisa Durasi First Reply" />
          <CardBody>
            <DurasiDoughnut data={durasiFRData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Analisa Durasi Total Penyelesaian" />
          <CardBody>
            <DurasiBar labels={durasiPenData.map((d) => d.label)} values={durasiPenData.map((d) => d.value)} colors={durasiPenColors} />
          </CardBody>
        </Card>
      </div>

      {/* Data table */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title={
              <span>
                Daftar Semua Aduan
                <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {agg.recent.length.toLocaleString("id-ID")} dari {agg.total.toLocaleString("id-ID")} data terbaru
                </span>
              </span>
            }
            subtitle="Menampilkan 200 data terbaru untuk performa optimal"
          />
          <AduanTable rows={agg.recent} layananOptions={layananOptions} />
        </Card>
      </div>
    </div>
  );
}