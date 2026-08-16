#!/usr/bin/env node
/**
 * Sync data aduan dari API workflow → tabel MySQL `tb_aduansync`.
 * Ini sumber data utama dashboard aduan. Jalankan via cron agar tabel
 * selalu segar (lihat komentar cron di bawah).
 *
 * Strategi: upsert (INSERT ... ON DUPLICATE KEY UPDATE) berdasaticketid —
 * baris baru ditambah, baris lama yang berubah diperbarui otomatis.
 * Menggantikan cache file var/cache/aduan.json (opsi C sebelumnya).
 */
// Cron (tiap 10 menit) — tambahkan ke crontab:
//   "*/10 * * * * cd /path/to/superapps-nextjs && node scripts/warmup-aduan.mjs >> /var/log/aduan-warmup.log 2>&1"

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_SIZE = 5000;
// Sequential (bukan paralel): API workflow mudah 502/503 saat dibebani banyak
// request bersamaan. Satu-per-satu lebih lambat tapi jauh lebih stabil.
const BATCH = 1;
const TIMEOUT_MS = 180_000;

// Baca .env.local agar kredensial sama dengan aplikasi (bila tersedia).
function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local tidak ada — pakai fallback di bawah */
  }
}
loadEnv();

const BASE = process.env.WORKFLOW_API_URL || "https://workflow.digitalteam.id/webhook";
const USER = process.env.WORKFLOW_API_USER || "";
const PASS = process.env.WORKFLOW_API_PASS || "";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${USER}:${PASS}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode} untuk ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error untuk ${url}`));
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error(`Request timeout untuk ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

async function fetchPage(page) {
  const url = `${BASE}/dashboard/complaints?page=${page}&limit=${PAGE_SIZE}`;
  // API workflow sering 502/503 sesekali — retry agresif dengan backoff.
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fetchJson(url);
    } catch (err) {
      if (attempt === 6) throw err;
      const wait = Math.min(3000 * attempt, 20000);
      console.log(`[warmup] page ${page} percobaan ${attempt} gagal (${err.message}) — tunggu ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function extractData(r) {
  if (r && Array.isArray(r.data)) return r.data;
  if (Array.isArray(r) && r[0] && Array.isArray(r[0].data)) return r[0].data;
  return null;
}

/** Normalisasi satu baris API → nilai kolom tabel. */
function toRow(a) {
  return {
    ticketid: a.ticketid,
    Layanan: a.Layanan ?? null,
    waktu_aduan: a.waktu_aduan ?? null,
    first_reply_date: a.first_reply_date ?? null,
    first_reply_message: a.first_reply_message ?? null,
    waktu_respon_opd: a.waktu_respon_opd ?? null,
    opd_first_reply_message: a.opd_first_reply_message ?? null,
    last_reply_date: a.last_reply_date ?? null,
    last_reply_message: a.last_reply_message ?? null,
    durasi_first_reply: a.durasi_first_reply ?? null,
    durasi_opd_response: a.durasi_opd_response ?? null,
    durasi_replies_first_last: a.durasi_replies_first_last ?? null,
    nama_pelapor: a.nama_pelapor ?? null,
    pesan_aduan: a.pesan_aduan ?? null,
    status: a.status ?? null,
    kategori: a.kategori ?? null,
    no_hp: a.no_hp ?? null,
    tanggal: a.tanggal ?? null,
    longlat: a.longlat ?? null,
    alamat: a.alamat ?? null,
    kecamatan: a.kecamatan ?? null,
    kelurahan: a.kelurahan ?? null,
  };
}

async function upsertBatch(conn, rows) {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const placeholders = rows.map(() => `(${cols.map(() => "?").join(",")})`).join(",");
  const values = rows.flatMap((r) => cols.map((c) => r[c]));
  const update = cols
    .filter((c) => c !== "ticketid")
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(", ");
  const sql = `INSERT INTO tb_aduansync (\`${cols.join("`,`")}\`)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE ${update}`;
  const [res] = await conn.query(sql, values);
  return res.affectedRows ?? 0;
}

async function main() {
  const t0 = Date.now();
  console.log(`[warmup] mulai sync aduan dari ${BASE} ...`);

  const first = await fetchPage(1);
  const data = extractData(first);
  if (!data || data.length === 0) {
    throw new Error("Halaman pertama kosong / format tidak dikenal");
  }
  const meta = first?.meta ?? (Array.isArray(first) ? first[0]?.meta : null);
  const totalPages = Math.min(
    meta && Number(meta.total_pages) > 0 ? Number(meta.total_pages) : 1,
    100
  );

  const allRows = data.map(toRow);
  console.log(`[warmup] page 1 OK (${data.length} baris), total ${totalPages} halaman`);

  for (let start = 2; start <= totalPages; start += BATCH) {
    const end = Math.min(start + BATCH - 1, totalPages);
    const results = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => fetchPage(start + i))
    );
    for (const r of results) {
      const d = extractData(r);
      if (d) allRows.push(...d.map(toRow));
    }
    console.log(`[warmup] pages ${start}-${end} OK`);
  }

  console.log(`[warmup] total ${allRows.length} baris → upsert ke tb_aduansync ...`);
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "superapps",
    dateStrings: true,
  });

  // Upsert dalam batch kecil (max_allowed_packet server 1MB).
  const CHUNK = 100;
  let affected = 0;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    affected += await upsertBatch(conn, allRows.slice(i, i + CHUNK));
  }

  const [cnt] = await conn.query("SELECT COUNT(*) n FROM tb_aduansync");
  console.log(
    `[warmup] selesai: ${allRows.length} baris diproses (affected ${affected}), ` +
      `total di tabel ${cnt[0].n} (${((Date.now() - t0) / 1000).toFixed(1)}s)`
  );
  await conn.end();
}

main().catch((err) => {
  console.error("[warmup] GAGAL:", err.message);
  process.exit(1);
});