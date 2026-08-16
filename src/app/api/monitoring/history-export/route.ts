import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const start = sp.get("start") || sevenAgo;
  const end = sp.get("end") || today;
  const apiId = sp.get("api_id") || "";
  const status = sp.get("status") || "";

  let sql = `SELECT h.checked_at, a.api_name, h.status, h.http_code, h.response_time_ms, h.error_message
             FROM tb_api_history h
             JOIN tb_api a ON a.id = h.api_id
             WHERE h.checked_at BETWEEN ? AND ?`;
  const params: unknown[] = [`${start} 00:00:00`, `${end} 23:59:59`];

  if (apiId) {
    sql += " AND h.api_id = ?";
    params.push(apiId);
  }
  if (status === "online" || status === "offline") {
    sql += " AND h.status = ?";
    params.push(status);
  }
  sql += " ORDER BY h.checked_at DESC LIMIT 10000";

  const rows = await query<Record<string, unknown>>(sql, params);

  const header = "Waktu Cek,Nama API,Status,HTTP Code,Response (ms),Error";
  const lines = rows.map((r) =>
    [
      String(r.checked_at ?? ""),
      `"${String(r.api_name ?? "").replace(/"/g, '""')}"`,
      r.status,
      r.http_code ?? "",
      r.response_time_ms ?? "",
      `"${String(r.error_message ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csv = "\uFEFF" + [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="riwayat_monitoring_api_${start}_${end}.csv"`,
    },
  });
}