import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { DoughnutChartJS, BarChartJS, type PieDatum } from "@/components/chartjs-charts";
import { JalanSehatTable } from "@/components/jalan-sehat-table";
import { getJalanSehatData, getAllJalanSehat } from "@/lib/jalan-sehat-server";
import { Users, CalendarDays, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JalanSehatPage() {
  await requireAuth();

  const [data, all] = await Promise.all([getJalanSehatData(), getAllJalanSehat()]);

  // Tabel hanya menampilkan 200 pendaftar terbaru (payload ringan),
  // seperti pendekatan dashboard aduan.
  const recent = [...all]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 200);

  const tipeData: PieDatum[] = [
    { label: "ASN", value: data.asn, color: "#4e73df" },
    { label: "Masyarakat", value: data.masyarakat, color: "#1cc88a" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard Jalan Sehat" subtitle="Registrasi peserta Jalan Sehat dari workflow.digitalteam.id" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <StatCard
          title="ASN / Masyarakat"
          value={`${data.asn.toLocaleString("id-ID")} / ${data.masyarakat.toLocaleString("id-ID")}`}
          icon={UserCheck}
          tone="amber"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Tipe Peserta" />
          <CardBody>
            <DoughnutChartJS data={tipeData} height={280} />
            <div className="mt-3 flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#4e73df" }} />
                ASN: {data.asn.toLocaleString("id-ID")}
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#1cc88a" }} />
                Masyarakat: {data.masyarakat.toLocaleString("id-ID")}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
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

      {/* Kelurahan + Instansi tables */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Data Kelurahan" />
          <CardBody className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">No</th>
                    <th className="px-5 py-3">Kelurahan</th>
                    <th className="px-5 py-3">Kecamatan</th>
                    <th className="px-5 py-3 text-center">ASN</th>
                    <th className="px-5 py-3 text-center">Masyarakat</th>
                    <th className="px-5 py-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.kelurahanDetails.map((d, i) => (
                    <tr key={d.kelurahan} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-5 py-2.5 text-slate-700">{d.kelurahan}</td>
                      <td className="px-5 py-2.5 text-slate-600">{d.kecamatan}</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {d.asn.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {d.masyarakat.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center font-bold text-slate-800">
                        {d.total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 border-t border-slate-200 bg-slate-50 font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-right">TOTAL:</td>
                    <td className="px-5 py-3 text-center text-blue-700">{data.asn.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-3 text-center text-green-700">{data.masyarakat.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-3 text-center">{data.total.toLocaleString("id-ID")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Data Instansi (ASN)" />
          <CardBody className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">No</th>
                    <th className="px-5 py-3">Instansi</th>
                    <th className="px-5 py-3 text-center">Jumlah ASN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.instansiDetails
                    .filter((d) => d.asn > 0)
                    .map((d, i) => (
                      <tr key={d.instansi} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5 text-slate-500">{i + 1}</td>
                        <td className="px-5 py-2.5 text-slate-700">{d.instansi}</td>
                        <td className="px-5 py-2.5 text-center">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {d.asn.toLocaleString("id-ID")}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="sticky bottom-0 border-t border-slate-200 bg-slate-50 font-bold text-slate-800">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 text-right">TOTAL:</td>
                    <td className="px-5 py-3 text-center text-blue-700">{data.asn.toLocaleString("id-ID")}</td>
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
            title="Data Pendaftar Jalan Sehat"
            subtitle={`Menampilkan ${data.total.toLocaleString("id-ID")} pendaftar`}
          />
          <JalanSehatTable
            rows={recent}
            districtOptions={data.districtOptions}
            instansiOptions={data.instansiOptions}
          />
        </Card>
      </div>
    </div>
  );
}