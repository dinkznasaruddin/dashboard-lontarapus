import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { BarChartJS } from "@/components/chartjs-charts";
import { HutTable } from "@/components/hut-table";
import { getHutData, getAllHut } from "@/lib/hut-server";
import { Users, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HutPage() {
  await requireAuth();

  const [data, all] = await Promise.all([getHutData(), getAllHut()]);

  // Tabel hanya menampilkan 200 pendaftar terbaru (payload ringan),
  // seperti pendekatan dashboard aduan.
  const recent = [...all]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 200);

  return (
    <div>
      <PageHeader title="Dashboard HUT Kota Makassar" subtitle="Registrasi peserta HUT Kota Makassar dari workflow.digitalteam.id" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <StatCard
          title="Total Pendaftar"
          value={data.total.toLocaleString("id-ID")}
          icon={Users}
          tone="blue"
        />
        <StatCard
          title="Pendaftar Hari Ini"
          value={data.hariIni.toLocaleString("id-ID")}
          icon={CalendarDays}
          tone="green"
        />
      </div>

      {/* Chart */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Registrasi per Kecamatan" />
          <CardBody>
            <BarChartJS
              labels={data.districtCounts.map((d) => d.label)}
              values={data.districtCounts.map((d) => d.value)}
              color="#4e73df"
              height={300}
            />
          </CardBody>
        </Card>
      </div>

      {/* Kelurahan table */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Data Kelurahan" />
          <CardBody className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">No</th>
                    <th className="px-5 py-3">Kelurahan</th>
                    <th className="px-5 py-3 text-center">Jumlah Pendaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.kelurahanRows.map((d, i) => (
                    <tr key={d.kelurahan} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-5 py-2.5 text-slate-700">{d.kelurahan}</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {d.total.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 border-t border-slate-200 bg-slate-50 font-bold text-slate-800">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 text-right">TOTAL:</td>
                    <td className="px-5 py-3 text-center">{data.total.toLocaleString("id-ID")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Data table */}
      <div className="mt-6">
        <Card>
          <CardHeader
            title="Data Pendaftar HUT Kota Makassar"
            subtitle={`Menampilkan ${data.total.toLocaleString("id-ID")} pendaftar`}
          />
          <HutTable rows={recent} districtOptions={data.districtOptions} />
        </Card>
      </div>
    </div>
  );
}