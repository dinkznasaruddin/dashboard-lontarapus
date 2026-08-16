/**
 * Klien untuk API eksternal yang dipakai dashboard:
 * - Workflow (aduan): https://workflow.digitalteam.id/webhook
 * - Berita: https://api.makassarkota.go.id/api/news
 * - Register (Lontara): https://api-lontara.makassarkota.go.id/v1/data/users
 */

import https from "https";
import fs from "fs";
import os from "os";
import path from "path";

const WORKFLOW_BASE = process.env.WORKFLOW_API_URL || "https://workflow.digitalteam.id/webhook";
const WORKFLOW_USER = process.env.WORKFLOW_API_USER || "";
const WORKFLOW_PASS = process.env.WORKFLOW_API_PASS || "";

const NEWS_BASE = process.env.NEWS_API_URL || "https://api.makassarkota.go.id/api/news";
const NEWS_USER = process.env.NEWS_API_USER || "";
const NEWS_PASS = process.env.NEWS_API_PASS || "";

// Data berita di API diurutkan terbaru-dahulu. Cukup ambil data 2025 ke atas
// (1465 berita 2025 + 670 berita 2026 = 2135). Endpoint /limit/2200 mencakup
// semuanya dan jauh lebih ringan daripada /api/news penuh yang sering timeout.
const NEWS_LIMIT = 2200;

const REGISTER_BASE =
  process.env.REGISTER_API_URL || "https://api-lontara.makassarkota.go.id/v1/data/users";
const REGISTER_SECRET =
  process.env.REGISTER_API_SECRET ||
  "5a723c52e97c33ffbeb9b684c3f0feb525566ade0757706568f7f4eee20160ad";

/** Basic auth header. */
function basicAuth(user: string, pass: string): string {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

interface FetchOptions {
  revalidate?: number;
  headers?: Record<string, string>;
}

async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const res = await fetch(url, {
    headers: opts.headers,
    next: { revalidate: opts.revalidate ?? 600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${url}`);
  return (await res.json()) as T;
}

/**
 * Fetch berbasis https node — dipakai untuk API yang lambat (workflow aduan).
 * fetch global (undici) punya connect-timeout default 10s, sehingga request
 * yang butuh >10s untuk koneksi selalu gagal. Di sini timeout dikendalikan
 * manual (connect + response) dengan nilai panjang.
 */
export async function fetchJsonSlow<T>(
  url: string,
  opts: { headers?: Record<string, string>; timeoutMs?: number; connectTimeoutMs?: number } = {}
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const connectTimeoutMs = opts.connectTimeoutMs ?? 60_000;
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(connectTimer);
      clearTimeout(deadline);
      req.destroy();
      reject(err);
    };
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: { ...opts.headers, "Content-Type": "application/json" },
      },
      (res) => {
        // Begitu koneksi + respons pertama tiba, connect-phase selesai.
        clearTimeout(connectTimer);
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          if (settled) return;
          settled = true;
          clearTimeout(deadline);
          const body = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode} untuk ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (e) {
            reject(new Error(`JSON parse error untuk ${url}`));
          }
        });
      }
    );
    const connectTimer = setTimeout(() => {
      fail(new Error(`Connect timeout (${connectTimeoutMs}ms) untuk ${url}`));
    }, connectTimeoutMs);
    const deadline = setTimeout(() => {
      fail(new Error(`Request timeout (${timeoutMs}ms) untuk ${url}`));
    }, timeoutMs);
    req.on("error", (e) => {
      if (!settled) fail(e as Error);
    });
    req.end();
  });
}

/* ------------------------------- WORKFLOW -------------------------------- */

// Endpoint event_registrations memakai kredensial berbeda dari aduan
// (sama seperti dashboard-jalan-santai.php lama).
const EVENT_API_USER =
  process.env.JALAN_SEHAT_API_USER || "support@lontaraplus.makassarkota.go.id";
const EVENT_API_PASS = process.env.JALAN_SEHAT_API_PASS || "Hut418@";

/** Ambil data aduan (complaints) dari workflow. */
export async function fetchComplaints<T = unknown>(
  params: RegisterParams = {},
  revalidate = 600
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {})
  ).toString();
  const url = `${WORKFLOW_BASE}/dashboard/complaints${query ? `?${query}` : ""}`;
  // fetchJsonSlow: API aduan lambat (>10s koneksi), fetch global mudah timeout.
  return fetchJsonSlow<T>(url, {
    headers: { Authorization: basicAuth(WORKFLOW_USER, WORKFLOW_PASS) },
  });
}

/** Normalize payload aduan: return array item di dalam `data` / `[0].data`. */
export function extractListPayload<T = unknown>(decoded: any): T[] {
  if (decoded && Array.isArray(decoded.data)) return decoded.data as T[];
  if (Array.isArray(decoded) && decoded[0] && Array.isArray(decoded[0].data)) {
    return decoded[0].data as T[];
  }
  if (Array.isArray(decoded)) return decoded as T[];
  return [];
}

/** Ambil SELURUH data aduan (paging semua halaman) seperti fetchAduanFromAPI() lama. */
export async function fetchAllComplaints<T = unknown>(
  revalidate = 600
): Promise<T[]> {
  // API lambat: biaya per-request didominasi overhead tetap (~27s) + ukuran.
  // Pakai limit besar (5000) → cukup 6 halaman untuk ~25.7k baris, alih-alih
  // 52 halaman @500. Limit 10000+ menimbulkan 502/503 di API.
  const pageSize = 5000;
  const items: T[] = [];

  const first = await fetchComplaintsWithRetry<any>({ page: 1, limit: pageSize }, revalidate);
  const firstData = Array.isArray(first?.data)
    ? first.data
    : Array.isArray(first) && first[0]?.data
      ? first[0].data
      : null;
  const meta = first?.meta ?? (Array.isArray(first) ? first[0]?.meta : null);

  if (!Array.isArray(firstData) || firstData.length === 0) return [];
  items.push(...firstData);

  let totalPages = meta && Number(meta.total_pages) > 0 ? Number(meta.total_pages) : 1;
  if (totalPages > 100) totalPages = 100; // batas aman

  // Ambil halaman berikutnya secara paralel (sedikit halaman → ringan).
  const BATCH = 3;
  for (let start = 2; start <= totalPages; start += BATCH) {
    const end = Math.min(start + BATCH - 1, totalPages);
    const results = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) =>
        // API intermitten (502/503 sesekali): retry per-halaman agar satu
        // kegagalan tidak membatalkan seluruh batch.
        fetchComplaintsWithRetry<any>({ page: start + i, limit: pageSize }, revalidate)
      )
    );
    for (const r of results) {
      const d = Array.isArray(r?.data)
        ? r.data
        : Array.isArray(r) && r[0]?.data
          ? r[0].data
          : null;
      if (Array.isArray(d)) items.push(...d);
    }
  }

  return items;
}

/** fetchComplaints dengan retry (API workflow sering 502/503 sesekali). */
async function fetchComplaintsWithRetry<T>(
  params: RegisterParams,
  revalidate: number
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchComplaints<T>(params, revalidate);
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  throw lastErr;
}

/** Ambil seluruh data registrasi event dari workflow (berpaginasi). */
async function fetchAllEventRegistrations<T>(
  eventType: string
): Promise<T[]> {
  const pageSize = 1000;
  const maxPages = 100; // 100 * 1000 = 100.000 (safety limit)
  const items: T[] = [];
  const headers = { Authorization: basicAuth(EVENT_API_USER, EVENT_API_PASS) };

  for (let page = 1; page <= maxPages; page++) {
    const url = `${WORKFLOW_BASE}/event_registrations?page=${page}&limit=${pageSize}&event_type=${eventType}`;
    let data: any = null;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        data = await fetchJsonSlow<T>(url, { headers });
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    if (data === null) throw lastErr;
    const arr = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : null;
    if (!Array.isArray(arr) || arr.length === 0) break;
    items.push(...(arr as T[]));
    if (arr.length < pageSize) break;
  }

  return items;
}

/** Ambil seluruh data registrasi Jalan Sehat (event_type=jalansehat). */
export async function fetchAllJalanSehat<T = unknown>(): Promise<T[]> {
  return fetchAllEventRegistrations<T>("jalansehat");
}

/** Ambil seluruh data registrasi HUT Kota Makassar (event_type=hut). */
export async function fetchAllHut<T = unknown>(): Promise<T[]> {
  return fetchAllEventRegistrations<T>("hut");
}

/* -------------------------------- BERITA --------------------------------- */

// File-cache lokal untuk data berita (mirip pola PHP lama yang menyimpan di
// sys_get_temp_dir() selama 600s). Dipakai sebagai fallback saat API timeout:
// halaman tetap menampilkan data terakhir yang berhasil, bukan kosong.
const NEWS_CACHE_FILE = path.join(os.tmpdir(), "lontara_news_cache.json");
const NEWS_CACHE_TTL_MS = 10 * 60 * 1000; // 600s, sama seperti PHP lama

interface NewsCacheEntry {
  savedAt: number;
  payload: unknown;
}

function readNewsCache(): NewsCacheEntry | null {
  try {
    const raw = fs.readFileSync(NEWS_CACHE_FILE, "utf8");
    return JSON.parse(raw) as NewsCacheEntry;
  } catch {
    return null;
  }
}

function writeNewsCache(payload: unknown): void {
  try {
    const entry: NewsCacheEntry = { savedAt: Date.now(), payload };
    fs.writeFileSync(NEWS_CACHE_FILE, JSON.stringify(entry));
  } catch {
    // Abaikan — cache gagal tulis bukan kondisi fatal.
  }
}

/**
 * Ambil data berita dari api.makassarkota.go.id.
 * Selalu pakai endpoint /limit/{NEWS_LIMIT} (data 2025+) — /api/news penuh
 * berat dan sering timeout.
 *
 * Strategi cache-first (mirip pola PHP lama yang menyimpan di sys_get_temp_dir):
 *  1. Cache lokal fresh (< 600s) → langsung kembalikan, TANPA memanggil API.
 *     Ini membuat halaman selalu cepat setelah fetch pertama berhasil.
 *  2. Cache kedaluwarsa/tidak ada → coba API (hard deadline + retry singkat).
 *     Sukses → simpan cache, kembalikan data.
 *  3. API gagal → kembalikan cache stale (lebih baik daripada kosong/menggantung).
 */
export async function fetchNews<T = unknown>(
  revalidate = 600,
  timeoutMs = 12_000,
  connectTimeoutMs = 8_000
): Promise<T> {
  void revalidate; // cache dikelola pemanggil (unstable_cache) + file cache lokal di sini

  // 1. Cache fresh → instan.
  const cached = readNewsCache();
  if (cached && Date.now() - cached.savedAt < NEWS_CACHE_TTL_MS) {
    return cached.payload as T;
  }

  // 2. Cache kedaluwarsa / tidak ada → coba API.
  const headers = { Authorization: basicAuth(NEWS_USER, NEWS_PASS) };
  const url = `${NEWS_BASE}/limit/${NEWS_LIMIT}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await fetchJsonSlow<T>(url, { headers, timeoutMs, connectTimeoutMs });
      writeNewsCache(data);
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // 3. API gagal → fallback ke cache stale.
  if (cached) return cached.payload as T;

  throw lastErr;
}

/* -------------------------------- REGISTER ------------------------------- */

interface RegisterParams {
  [key: string]: string | number;
}

/** Ambil data register peserta dari API Lontara. */
export async function fetchRegister<T = unknown>(
  endpoint: string,
  params: RegisterParams = {},
  revalidate = 300
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {})
  ).toString();

  const url = `${REGISTER_BASE}/${endpoint}${query ? `?${query}` : ""}`;
  return fetchJson<T>(url, {
    revalidate,
    headers: {
      "INTERNAL_SERVICE_SECRET": REGISTER_SECRET,
      "X-Service-Secret": REGISTER_SECRET,
    },
  });
}
