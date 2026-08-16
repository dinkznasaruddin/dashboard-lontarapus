import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { ClipboardCheck, CheckCircle2, AlertTriangle, Timer, FileDown, HeartPulse } from "lucide-react";
import Link from "next/link";

interface SummaryRow {
  id: number;
  api_name: string;
  total: number;
  online_cnt: number | null;
  offline_cnt: number | null;
  avg_ms: number | null;
  last_check: string | null;
}

interface HistoryRow {
  id: number;
  api_id: number;
  api_name: string;
  status: string;
  http_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

const PER_PAGE = 20;

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

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; api_id?: string; status?: string; page?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const start = sp.start || sevenAgo;
  const end = sp.end || today;
  const apiId = sp.api_id || "";
  const status = sp.status || "";
  let currentPage = Math.max(1, Number(sp.page) || 1);

  const startDt = `${start} 00:00:00`;
  const endDt = `${end} 23:59:59`;

  const apiOptions = await query<{ id: number; api_name: string }>(
    "SELECT id, api_name FROM tb_api ORDER BY api_name"
  );

  // Ringkasan per API
  let summarySql = `SELECT a.id, a.api_name,
        COUNT(h.id) AS total,
        SUM(h.status = 'online') AS online_cnt,
        SUM(h.status = 'offline') AS offline_cnt,
        ROUND(AVG(h.response_time_ms)) AS avg_ms,
        MAX(h.checked_at) AS last_check
      FROM tb_api a
      LEFT JOIN tb_api_history h
        ON h.api_id = a.id AND h.checked_at BETWEEN ? AND ?
      WHERE 1=1`;
  const summaryParams: unknown[] = [startDt, endDt];

  if (apiId) {
    summarySql += " AND a.id = ?";
    summaryParams.push(apiId);
  }
  if (status === "online" || status === "offline") {
    summarySql += " AND (h.status = ? OR h.status IS NULL)";
    summaryParams.push(status);
  }
  summarySql += " GROUP BY a.id, a.api_name ORDER BY a.api_name";

  const summary = await query<SummaryRow>(summarySql, summaryParams);

  // Detail riwayat (dengan pagination)
  let detailSql = `SELECT h.*, a.api_name
        FROM tb_api_history h
        JOIN tb_api a ON a.id = h.api_id
        WHERE h.checked_at BETWEEN ? AND ?`;
  const detailParams: unknown[] = [startDt, endDt];

  let countSql = `SELECT COUNT(*) AS total
        FROM tb_api_history h
        JOIN tb_api a ON a.id = h.api_id
        WHERE h.checked_at BETWEEN ? AND ?`;
  const countParams: unknown[] = [startDt, endDt];

  if (apiId) {
    detailSql += " AND h.api_id = ?";
    detailParams.push(apiId);
    countSql += " AND h.api_id = ?";
    countParams.push(apiId);
  }
  if (status === "online" || status === "offline") {
    detailSql += " AND h.status = ?";
    detailParams.push(status);
    countSql += " AND h.status = ?";
    countParams.push(status);
  }

  const [countRow] = await query<{ total: number }>(countSql, countParams);
  const totalRows = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalRows / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
  const startRow = (currentPage - 1) * PER_PAGE + 1;
  const endRow = Math.min(currentPage * PER_PAGE, totalRows);

  detailSql += " ORDER BY h.checked_at DESC LIMIT ? OFFSET ?";
  detailParams.push(PER_PAGE, (currentPage - 1) * PER_PAGE);

  const history = await query<HistoryRow>(detailSql, detailParams);

  const pageBase = new URLSearchParams({ start, end, api_id: apiId, status });

  // Statistik
  let totalChecks = 0;
  let onlineChecks = 0;
  let offlineChecks = 0;
  const avgTimes: number[] = [];
  for (const r of summary) {
    totalChecks += Number(r.total);
    onlineChecks += Number(r.online_cnt ?? 0);
    offlineChecks += Number(r.offline_cnt ?? 0);
    if (r.avg_ms !== null) avgTimes.push(Number(r.avg_ms));
  }
  const avg = avgTimes.length ? Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) : null;

  const exportUrl =
    `/api/monitoring/history-export?start=${start}&end=${end}&api_id=${apiId}&status=${status}`;

  return (
    <div>
      <PageHeader
        title="Riwayat Monitoring API"
        subtitle="Rekap hasil pengecekan untuk laporan"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/monitoring-api"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <HeartPulse className="h-4 w-4" />
              Monitoring
            </Link>
            <a
              href={exportUrl}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </a>
          </div>
        }
      />

      {/* Filter */}
      <Card className="mb-6">
        <CardBody>
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Dari Tanggal</label>
              <input type="date" name="start" defaultValue={start} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Sampai Tanggal</label>
              <input type="date" name="end" defaultValue={end} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">API</label>
              <select name="api_id" defaultValue={apiId} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Semua API</option>
                {apiOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.api_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
              <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Semua</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Tampilkan
            </button>
            <a href="/monitoring-api/riwayat" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Reset
            </a>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Pengecekan" value={totalChecks.toLocaleString("id-ID")} icon={ClipboardCheck} tone="blue" />
        <StatCard title="Online" value={onlineChecks.toLocaleString("id-ID")} icon={CheckCircle2} tone="green" />
        <StatCard title="Offline" value={offlineChecks.toLocaleString("id-ID")} icon={AlertTriangle} tone="red" />
        <StatCard title="Rata-rata Response" value={avg !== null ? `${avg} ms` : "-"} icon={Timer} tone="amber" />
      </div>

      {/* Ringkasan per API */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Ketersediaan per API" />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Nama API</th>
                    <th className="px-5 py-3">Total Cek</th>
                    <th className="px-5 py-3">Online</th>
                    <th className="px-5 py-3">Offline</th>
                    <th className="px-5 py-3">Ketersediaan</th>
                    <th className="px-5 py-3">Rata-rata</th>
                    <th className="px-5 py-3">Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.map((r) => {
                    const total = Number(r.total);
                    const onlineC = Number(r.online_cnt ?? 0);
                    const offlineC = Number(r.offline_cnt ?? 0);
                    const uptime = total > 0 ? Math.round((onlineC / total) * 1000) / 10 : 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-700">{r.api_name}</td>
                        <td className="px-5 py-3 text-center">{total.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-center"><Badge color="green">{onlineC.toLocaleString("id-ID")}</Badge></td>
                        <td className="px-5 py-3 text-center"><Badge color="red">{offlineC.toLocaleString("id-ID")}</Badge></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${uptime}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{uptime}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">{r.avg_ms !== null ? `${r.avg_ms} ms` : "-"}</td>
                        <td className="px-5 py-3 text-center text-xs text-slate-500">{r.last_check ?? "-"}</td>
                      </tr>
                    );
                  })}
                  {summary.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data pada rentang tanggal ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Detail riwayat */}
      <div className="mt-6">
        <Card>
          <CardHeader title="Detail Riwayat Pengecekan" />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Waktu Cek</th>
                    <th className="px-5 py-3">Nama API</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">HTTP Code</th>
                    <th className="px-5 py-3">Response</th>
                    <th className="px-5 py-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-xs text-slate-500">{h.checked_at}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{h.api_name}</td>
                      <td className="px-5 py-3"><Badge color={h.status === "online" ? "green" : "red"}>{h.status === "online" ? "Online" : "Offline"}</Badge></td>
                      <td className="px-5 py-3 text-center">{h.http_code ?? "-"}</td>
                      <td className="px-5 py-3 text-center">{h.response_time_ms !== null ? `${h.response_time_ms} ms` : "-"}</td>
                      <td className="px-5 py-3 text-xs text-red-500">{h.error_message ?? ""}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Belum ada riwayat pada rentang tanggal ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalRows > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                <p className="text-xs text-slate-500">
                  Menampilkan <strong>{startRow.toLocaleString("id-ID")}</strong>–
                  <strong>{endRow.toLocaleString("id-ID")}</strong> dari{" "}
                  <strong>{totalRows.toLocaleString("id-ID")}</strong> riwayat
                </p>
                <nav className="flex items-center gap-1">
                  <a
                    href={currentPage > 1 ? `/monitoring-api/riwayat?${pageBase}&page=${currentPage - 1}` : "#"}
                    aria-disabled={currentPage <= 1}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      currentPage > 1
                        ? "text-slate-600 hover:bg-slate-100"
                        : "pointer-events-none text-slate-300"
                    }`}
                  >
                    « Prev
                  </a>
                  {pageRange(currentPage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="px-2 py-1.5 text-sm text-slate-400">
                        …
                      </span>
                    ) : (
                      <a
                        key={p}
                        href={`/monitoring-api/riwayat?${pageBase}&page=${p}`}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          p === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </a>
                    )
                  )}
                  <a
                    href={currentPage < totalPages ? `/monitoring-api/riwayat?${pageBase}&page=${currentPage + 1}` : "#"}
                    aria-disabled={currentPage >= totalPages}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      currentPage < totalPages
                        ? "text-slate-600 hover:bg-slate-100"
                        : "pointer-events-none text-slate-300"
                    }`}
                  >
                    Next »
                  </a>
                </nav>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}