import { query } from "@/lib/db";

export interface ApiCheckResult {
  online: boolean;
  httpCode: number;
  responseTimeMs: number | null;
  error: string | null;
}

/**
 * Cek status endpoint API secara live. Endpoint yang merespon HTTP apa pun
 * (< 500) dianggap online karena banyak API butuh autentikasi (401/403 = online).
 */
export async function checkApiStatus(url: string, timeoutMs = 8000): Promise<ApiCheckResult> {
  const result: ApiCheckResult = {
    online: false,
    httpCode: 0,
    responseTimeMs: null,
    error: null,
  };

  if (!url) {
    result.error = "Endpoint kosong";
    return result;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "*/*" },
    });
    result.responseTimeMs = Math.round(performance.now() - start);
    result.httpCode = res.status;
    result.online = res.status < 500;
  } catch (err) {
    result.responseTimeMs = Math.round(performance.now() - start);
    result.error = err instanceof Error && err.name === "AbortError" ? "Timeout" : "Tidak dapat terhubung";
  } finally {
    clearTimeout(timer);
  }

  return result;
}

export interface HistoryRow {
  id: number;
  api_id: number;
  status: string;
  http_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

/**
 * Simpan hasil pengecekan ke tb_api_history. Lewati jika ada log dengan status
 * sama dalam interval (menghindari penumpukan data).
 */
export async function logApiCheck(
  apiId: number,
  status: string,
  httpCode: number,
  responseTimeMs: number | null,
  error: string | null,
  minIntervalSec = 300
): Promise<void> {
  const rows = await query<HistoryRow>(
    "SELECT status, checked_at FROM tb_api_history WHERE api_id = ? ORDER BY checked_at DESC LIMIT 1",
    [apiId]
  );

  if (rows.length && rows[0].status === status) {
    const last = new Date(rows[0].checked_at).getTime();
    if (Date.now() - last < minIntervalSec * 1000) return;
  }

  await query(
    "INSERT INTO tb_api_history (api_id, status, http_code, response_time_ms, error_message, checked_at) VALUES (?, ?, ?, ?, ?, ?)",
    [apiId, status, httpCode, responseTimeMs, error, new Date().toISOString().slice(0, 19).replace("T", " ")]
  );
}

/** Bersihkan riwayat lebih lama dari N hari. */
export async function cleanupApiHistory(days = 30): Promise<void> {
  await query("DELETE FROM tb_api_history WHERE checked_at < DATE_SUB(NOW(), INTERVAL ? DAY)", [days]);
}
