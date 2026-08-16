import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkApiStatus, logApiCheck, cleanupApiHistory } from "@/lib/api-monitoring";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader } from "@/components/card";
import { StatusBadge } from "@/components/badge";
import { Server, CheckCircle2, AlertTriangle, Timer, RefreshCw, History } from "lucide-react";
import Link from "next/link";

interface ApiRow {
  id: number;
  api_name: string;
  end_poin: string;
  methods: string;
  status: string;
  opd: string;
}

interface CheckedRow extends ApiRow {
  httpCode: number;
  responseTimeMs: number | null;
  error: string | null;
  lastChecked: string;
}

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  await requireAuth();

  const apis = await query<ApiRow>(
    "SELECT id, api_name, end_poin, methods, status, opd FROM tb_api ORDER BY id"
  );

  // Jalankan pengecekan live (paralel)
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const rows: CheckedRow[] = await Promise.all(
    apis.map(async (api) => {
      const res = await checkApiStatus(api.end_poin, 8000);
      const status = res.online ? "online" : "offline";

      if (api.status !== status) {
        await query("UPDATE tb_api SET status = ? WHERE id = ?", [status, api.id]);
      }
      await logApiCheck(api.id, status, res.httpCode, res.responseTimeMs, res.error, 300);

      return { ...api, status, httpCode: res.httpCode, responseTimeMs: res.responseTimeMs, error: res.error, lastChecked: now };
    })
  );

  // Bersihkan riwayat > 30 hari
  await cleanupApiHistory(30);

  const online = rows.filter((r) => r.status === "online").length;
  const offline = rows.length - online;
  const avgMs = rows
    .map((r) => r.responseTimeMs)
    .filter((v): v is number => v !== null)
    .reduce((a, b) => a + b, 0);
  const avg = rows.some((r) => r.responseTimeMs !== null)
    ? Math.round(avgMs / rows.filter((r) => r.responseTimeMs !== null).length)
    : null;

  return (
    <div>
      <PageHeader
        title="Monitoring API"
        subtitle="Pengecekan live terhadap seluruh endpoint terdaftar"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/monitoring-api/riwayat"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <History className="h-4 w-4" />
              Riwayat
            </Link>
            <a
              href="/monitoring-api"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Cek Ulang
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total API" value={rows.length} icon={Server} tone="blue" />
        <StatCard title="Online" value={online} icon={CheckCircle2} tone="green" />
        <StatCard title="Offline / Error" value={offline} icon={AlertTriangle} tone="red" />
        <StatCard title="Rata-rata Response" value={avg !== null ? `${avg} ms` : "-"} icon={Timer} tone="amber" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Daftar API Integration Lontara+"
            subtitle={`Terakhir dicek: ${now}`}
            action={<Link href="/monitoring-api/kelola" className="text-sm font-medium text-blue-600 hover:underline">Kelola →</Link>}
          />
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                Belum ada API terdaftar. Tambahkan di menu Kelola Data API.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Nama API</th>
                      <th className="px-5 py-3">End Point</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">HTTP</th>
                      <th className="px-5 py-3">Response</th>
                      <th className="px-5 py-3">Terakhir Dicek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-700">{r.api_name}</td>
                        <td className="max-w-[280px] truncate px-5 py-3 font-mono text-xs text-slate-500">{r.end_poin}</td>
                        <td className="px-5 py-3 text-center">{r.methods}</td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3 text-center">
                          {r.httpCode > 0 ? <span className="font-mono text-xs">{r.httpCode}</span> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-5 py-3 text-center font-mono text-xs">
                          {r.responseTimeMs !== null ? `${r.responseTimeMs} ms` : r.error ? (
                            <span className="text-red-500">{r.error}</span>
                          ) : "-"}
                        </td>
                        <td className="px-5 py-3 text-center text-xs text-slate-500">{r.lastChecked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
