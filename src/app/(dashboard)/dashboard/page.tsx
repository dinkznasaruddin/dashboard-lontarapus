import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { fetchRegister } from "@/lib/apis";
import { getAllAduan } from "@/lib/aduan-server";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { SummaryCard, PercentChange } from "@/components/summary-card";
import { MultiLineChartJS, DoughnutChartJS, BarChartJS } from "@/components/chartjs-charts";
import { DashboardSkeleton } from "@/components/skeleton";
import { YearSelect } from "@/components/year-select";
import { CalendarDays, MessagesSquare, Users, Network } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TREND_YEAR_MIN = 2025;
const EMPTY_MONTHS = Array(12).fill(0);

const STATUS_EVENT_LABEL: Record<number, string> = {
  1: "Akan Datang",
  2: "Sedang Berlangsung",
  3: "Selesai",
};
const STATUS_EVENT_COLOR: Record<string, string> = {
  "Akan Datang": "#4e73df",
  "Sedang Berlangsung": "#1cc88a",
  Selesai: "#858796",
};

interface EventRow {
  created_at: string;
  status: number;
}

interface DashboardData {
  event: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    statusCounts: Record<string, number>;
    ok: boolean;
  };
  aduan: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    status: { label: string; value: number }[];
    kategori: { label: string; value: number }[];
  };
  register: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    summaryOk: boolean;
  };
  apiStatus: { key: string; status: string; message: string }[];
}

/* Semua pengambilan & agregasi data dashboard di-cache 10 menit agar akses
   berikutnya cepat (fetch eksternal + paging aduan tidak diulang). */
const loadDashboardData = unstable_cache(
  async (filterYear: number, currentYear: number): Promise<DashboardData> => {
    const today = new Date();
    const lastYear = currentYear - 1;

    /* ------------------------------- 1. EVENT ------------------------------- */
    const event: DashboardData["event"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      statusCounts: { "Akan Datang": 0, "Sedang Berlangsung": 0, Selesai: 0 },
      ok: false,
    };
    try {
      const rows = await query<EventRow>("SELECT created_at, status FROM tb_event");
      event.ok = true;
      event.total = rows.length;
      for (const r of rows) {
        const d = new Date(r.created_at);
        if (isNaN(+d)) continue;
        const y = d.getFullYear();
        if (y === currentYear) event.tahunIni++;
        if (y === lastYear) event.tahunLalu++;
        if (y === filterYear) event.perBulan[d.getMonth()]++;
        const label = STATUS_EVENT_LABEL[r.status];
        if (label) event.statusCounts[label]++;
      }
    } catch {}

    /* ------------------------------- 2. ADUAN ------------------------------- */
    const aduan: DashboardData["aduan"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      status: [],
      kategori: [],
    };
    try {
      const items = await getAllAduan();
      aduan.total = items.length;
      const statusMap = new Map<string, number>();
      const katMap = new Map<string, number>();
      for (const a of items) {
        const d = new Date(a.waktu_aduan ?? "");
        if (!isNaN(+d)) {
          const y = d.getFullYear();
          if (y === currentYear) aduan.tahunIni++;
          if (y === lastYear) aduan.tahunLalu++;
          if (y === filterYear) aduan.perBulan[d.getMonth()]++;
        }
        const s = a.status ?? "Unknown";
        statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
        const k = a.kategori ?? "Unknown";
        katMap.set(k, (katMap.get(k) ?? 0) + 1);
      }
      aduan.status = [...statusMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));
      aduan.kategori = [...katMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));
    } catch {}

    /* ------------------------------- 4. REGISTER ---------------------------- */
    const register: DashboardData["register"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      summaryOk: false,
    };
    let bulanIni = 0;
    let monthlyOk = false;
    try {
      const all = await fetchRegister<any>("summary", {});
      const cur = await fetchRegister<any>("summary", { year: String(currentYear) });
      const last = await fetchRegister<any>("summary", { year: String(lastYear) });
      register.summaryOk = !!(cur?.status || all?.status);
      register.total = all?.data?.total ?? 0;
      register.tahunIni = cur?.data?.total ?? 0;
      bulanIni = cur?.data?.month ?? cur?.data?.motnh ?? 0;
      register.tahunLalu = last?.data?.total ?? 0;

      try {
        const byMonth = await fetchRegister<any>("summary-by-registered-month", {
          year: String(filterYear),
        });
        if (Array.isArray(byMonth?.data)) {
          for (const it of byMonth.data) {
            const mi = Number(it.month);
            if (mi >= 1 && mi <= 12) register.perBulan[mi - 1] = Number(it.total ?? 0);
          }
          monthlyOk = true;
        }
      } catch {}
    } catch {
      // Fallback seperti index.php bila API Lontara tidak merespons
      register.summaryOk = false;
      register.total = 4361;
      register.tahunIni = 4361;
      bulanIni = 964;
      register.tahunLalu = 0;
    }

    if (!monthlyOk) {
      const avg = register.tahunIni > 0 ? Math.round(register.tahunIni / 12) : 0;
      for (let i = 0; i < 12; i++) {
        if (i < today.getMonth()) register.perBulan[i] = avg;
        else if (i === today.getMonth()) register.perBulan[i] = bulanIni;
        else register.perBulan[i] = 0;
      }
    }

    /* ---------------------------- STATUS API (2 sumber) ---------------------- */
    const apiStatus = [
      {
        key: "event",
        status: event.ok && event.total > 0 ? "success" : "error",
        message: event.ok && event.total > 0 ? "Connected" : "Database Error",
      },
      {
        key: "register",
        status: register.summaryOk ? "success" : "warning",
        message: register.summaryOk ? "Connected" : "Using Cache",
      },
    ];

    return { event, aduan, register, apiStatus };
  },
  ["lontara-dashboard-summary"],
  { revalidate: 600, tags: ["lontara-summary"] }
);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  await requireAuth();

  const currentYear = new Date().getFullYear();
  const sp = await searchParams;
  let filterYear = Number(sp.tahun);
  if (!filterYear || filterYear < TREND_YEAR_MIN || filterYear > currentYear) {
    filterYear = currentYear;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent filterYear={filterYear} currentYear={currentYear} />
    </Suspense>
  );
}

async function DashboardContent({
  filterYear,
  currentYear,
}: {
  filterYear: number;
  currentYear: number;
}) {
  const { event, aduan, register, apiStatus } = await loadDashboardData(
    filterYear,
    currentYear
  );

  const connected = apiStatus.filter((a) => a.status === "success").length;
  const dotColor: Record<string, string> = {
    success: "#1cc88a",
    warning: "#f6c23e",
    error: "#e74a3b",
  };

  const years: number[] = [];
  for (let y = currentYear; y >= TREND_YEAR_MIN; y--) years.push(y);

  const combined = [
    { name: "Event", color: "#4e73df", values: event.perBulan },
    { name: "Aduan", color: "#f6c23e", values: aduan.perBulan },
    { name: "Register", color: "#36b9cc", values: register.perBulan },
  ];

  const eventSlices = Object.entries(event.statusCounts).map(
    ([label, value]) => ({ label, value, color: STATUS_EVENT_COLOR[label] })
  );

  return (
    <div>
      <PageHeader
        title="Summary Dashboard"
        subtitle="Rekapitulasi data Event, Aduan, dan Register"
      />

      {/* === SECTION 1: CARDS TOTAL === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-1">
          <SummaryCard
            label="Total Event"
            value={event.total.toLocaleString("id-ID")}
            tahunIni={event.tahunIni}
            change={<PercentChange current={event.tahunIni} previous={event.tahunLalu} />}
            icon={CalendarDays}
            color="#4e73df"
          />
        </div>
        <div className="sm:col-span-1">
          <SummaryCard
            label="Total Aduan"
            value={aduan.total.toLocaleString("id-ID")}
            tahunIni={aduan.tahunIni}
            change={<PercentChange current={aduan.tahunIni} previous={aduan.tahunLalu} />}
            icon={MessagesSquare}
            color="#f6c23e"
          />
        </div>
        <div className="sm:col-span-1">
          <SummaryCard
            label="Total Register"
            value={register.total.toLocaleString("id-ID")}
            tahunIni={register.tahunIni}
            change={<PercentChange current={register.tahunIni} previous={register.tahunLalu} />}
            icon={Users}
            color="#36b9cc"
          />
        </div>

        {/* Status API Card */}
        <div className="sm:col-span-1">
          <div
            className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            style={{ borderLeft: "4px solid #858796" }}
          >
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Status API
                </div>
                <div className="mt-0.5 text-xl font-bold text-gray-800">
                  {connected}/{apiStatus.length} Connected
                </div>
                <div className="mt-2 space-y-1">
                  {apiStatus.map((a) => (
                    <div key={a.key} className="flex items-center text-xs text-slate-600">
                      <span
                        className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor[a.status] }}
                      />
                      <strong>{a.key === "event" ? "Event" : "Register"}:</strong>
                      &nbsp;{a.message}
                    </div>
                  ))}
                </div>
              </div>
              <Network className="h-7 w-7 shrink-0 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 2: CHARTS === */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Trend Bulanan */}
        <Card className="xl:col-span-2">
          <CardHeader
            title={`Trend Bulanan ${filterYear}`}
            action={<YearSelect years={years} selected={filterYear} />}
          />
          <CardBody>
            <MultiLineChartJS labels={MONTHS} series={combined} height={320} />
          </CardBody>
        </Card>

        {/* Status Event */}
        <Card>
          <CardHeader title="Status Event" />
          <CardBody>
            <DoughnutChartJS data={eventSlices} height={320} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Status Aduan" />
          <CardBody>
            <BarChartJS
              labels={aduan.status.map((s) => s.label)}
              values={aduan.status.map((s) => s.value)}
              color="#f6c23e"
              height={280}
              horizontal
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Top 5 Kategori Aduan" />
          <CardBody>
            <BarChartJS
              labels={aduan.kategori.map((k) => k.label)}
              values={aduan.kategori.map((k) => k.value)}
              color="#e74a3b"
              height={280}
              horizontal
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}