import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  MONTHS,
  TREND_YEAR_MIN,
  STATUS_EVENT_COLOR,
  loadDashboardData,
} from "@/lib/dashboard-data";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { SummaryCard, PercentChange } from "@/components/summary-card";
import { DoughnutChartJS, BarChartJS } from "@/components/chartjs-charts";
import { TrendChart } from "@/components/trend-chart";
import { DashboardSkeleton } from "@/components/skeleton";
import { CalendarDays, MessagesSquare, Users, Network, ArrowRight } from "lucide-react";

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
            href="/master-data/event"
            className="hover:border-[#4e73df]/40"
          />
        </div>
        <div className="sm:col-span-1">
          <SummaryCard
            label="Total Aduan"
            value={aduan.total.toLocaleString("id-ID")}
            tahunIni={aduan.tahunIni}
            change={<PercentChange current={aduan.tahunIni} previous={aduan.tahunLalu} />}
            icon={MessagesSquare}
            color="#e74a3b"
            href="/aduan"
            className="hover:border-[#e74a3b]/40"
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
            href="/register"
            className="hover:border-[#36b9cc]/50"
          />
        </div>

        {/* Status API Card */}
        <div className="sm:col-span-1">
          <Link
            href="/monitoring-api"
            className="group block h-full rounded-lg"
            title="Lihat detail Monitoring API"
          >
            <div
              className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
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
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-500">
                Selengkapnya
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* === SECTION 2: CHARTS === */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Trend Bulanan */}
        <Card className="xl:col-span-2">
          <TrendChart
            labels={MONTHS}
            years={years}
            initialYear={filterYear}
            initialSeries={combined}
          />
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