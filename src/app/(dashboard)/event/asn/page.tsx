import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { DoughnutChartJS, type PieDatum } from "@/components/chartjs-charts";
import { AsnTable } from "@/components/asn-table";
import { getAsnData, queryAsnTable } from "@/lib/asn-server";
import { formatTitleCase } from "@/lib/asn";
import { Users, UserCheck, UserX, ChartPie } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796"];

export default async function AsnPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; satker?: string; q?: string; page?: string }>;
}) {
  await requireAuth();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 10;

  const [data, table] = await Promise.all([
    getAsnData(),
    queryAsnTable({
      page,
      perPage,
      filterStatus: sp.status ?? "",
      filterSatker: sp.satker ?? "",
      search: sp.q ?? "",
    }),
  ]);

  const statusData: PieDatum[] = data.statusRekap.map((s, i) => ({
    label: s.status,
    value: s.jumlah,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  return (
    <div>
      <PageHeader title="Data Pegawai — Jalan Sehat" subtitle="Rekapitulasi partisipasi ASN pada pendaftaran Jalan Sehat" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Pegawai" value={data.totalASN.toLocaleString("id-ID")} icon={Users} tone="blue" />
        <StatCard title="Pegawai Sudah Daftar" value={data.asnTerdaftar.toLocaleString("id-ID")} icon={UserCheck} tone="green" />
        <StatCard title="Pegawai Belum Daftar" value={data.asnBelumDaftar.toLocaleString("id-ID")} icon={UserX} tone="amber" />
        <StatCard
          title="Persentase Partisipasi"
          value={
            <span className="flex items-center gap-3">
              {data.persentase.toFixed(2)}%
              <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, data.persentase)}%` }} />
              </span>
            </span>
          }
          icon={ChartPie}
          tone="red"
        />
      </div>

      {/* Rekap satker + status */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Rekapitulasi Partisipasi Per Satuan Kerja"
            subtitle="Kriteria terdaftar: NIK atau NIP ditemukan pada data pendaftaran Jalan Sehat."
          />
          <CardBody className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">No</th>
                    <th className="px-5 py-3">Satuan Kerja</th>
                    <th className="px-5 py-3 text-center">Jumlah Pegawai</th>
                    <th className="px-5 py-3 text-center">Pendaftar Jalan Sehat</th>
                    <th className="px-5 py-3 text-center">Belum Daftar</th>
                    <th className="px-5 py-3">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.satkerRekap.map((s, i) => (
                    <tr key={s.nama_satker} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-5 py-2.5 text-slate-700">{formatTitleCase(s.nama_satker)}</td>
                      <td className="px-5 py-2.5 text-center text-slate-700">{s.total_asn.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {s.terdaftar.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {s.belum_daftar.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">{s.persentase.toFixed(2)}%</span>
                          <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                s.persentase >= 75 ? "bg-emerald-500" : s.persentase >= 50 ? "bg-blue-500" : s.persentase >= 25 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(100, s.persentase)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.satkerRekap.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Distribusi Status Pegawai" />
          <CardBody>
            <DoughnutChartJS data={statusData} height={240} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Status Pegawai</th>
                    <th className="py-2 text-center">Jumlah</th>
                    <th className="py-2 text-center">Pendaftar</th>
                    <th className="py-2 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.statusRekap.map((s, i) => (
                    <tr key={s.status} className="hover:bg-slate-50">
                      <td className="py-2 pr-2">
                        <span className="flex items-center gap-1.5">
                          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <strong>{s.jumlah.toLocaleString("id-ID")}</strong>
                        <br />
                        <small className="text-slate-400">
                          ({data.totalPerStatus > 0 ? ((s.jumlah / data.totalPerStatus) * 100).toFixed(1) : 0}%)
                        </small>
                      </td>
                      <td className="py-2 text-center">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {s.terdaftar.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="h-[18px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              s.persentase >= 75 ? "bg-emerald-500" : s.persentase >= 50 ? "bg-blue-500" : s.persentase >= 25 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, s.persentase)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 font-bold text-slate-800">
                  <tr>
                    <th className="py-3">Total</th>
                    <th className="py-3 text-center">{data.totalPerStatus.toLocaleString("id-ID")}</th>
                    <th className="py-3 text-center">
                      {data.statusRekap.reduce((s, x) => s + x.terdaftar, 0).toLocaleString("id-ID")}
                    </th>
                    <th className="py-3 text-center">
                      {data.totalPerStatus > 0
                        ? ((data.statusRekap.reduce((s, x) => s + x.terdaftar, 0) / data.totalPerStatus) * 100).toFixed(1)
                        : 0}
                      %
                    </th>
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
            title="Daftar Pegawai"
            subtitle="Tips: cari berdasarkan Nama, NIP, Satuan Kerja, Unit Kerja, Status Pegawai, NIK, atau Status ('sudah daftar' / 'belum daftar')."
          />
          <AsnTable
            rows={table.rows}
            total={table.total}
            filtered={table.filtered}
            page={table.page}
            totalPages={table.totalPages}
            satkerOptions={data.satkerOptions}
          />
        </Card>
      </div>
    </div>
  );
}