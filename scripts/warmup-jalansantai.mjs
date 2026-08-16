#!/usr/bin/env node
/**
 * Sync data registrasi Jalan Sehat dari API workflow → tabel MySQL
 * `tb_event_jalan_sehat`. Ini sumber data utama dashboard Jalan Sehat.
 * Jalankan via cron agar tabel selalu segar (lihat komentar cron di bawah).
 *
 * Strategi: upsert (INSERT ... ON DUPLICATE KEY UPDATE) berdasarkan id —
 * baris baru ditambah, baris lama yang berubah diperbarui otomatis.
 */
// Cron (tiap 10 menit) — tambahkan ke crontab:
//   "*/10 * * * * cd /path/to/superapps-nextjs && node scripts/warmup-jalansantai.mjs >> /var/log/jalansantai-warmup.log 2>&1"

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = 1000;
const MAX_PAGES = 100;
const TIMEOUT_MS = 120_000;

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
// Endpoint event_registrations memakai kredensial berbeda dari aduan
// (sama seperti dashboard-jalan-santai.php lama).
const USER = process.env.JALAN_SEHAT_API_USER || "support@lontaraplus.makassarkota.go.id";
const PASS = process.env.JALAN_SEHAT_API_PASS || "Hut418@";

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
  const url = `${BASE}/event_registrations?page=${page}&limit=${LIMIT}&event_type=jalansehat`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fetchJson(url);
    } catch (err) {
      if (attempt === 6) throw err;
      const wait = Math.min(3000 * attempt, 20000);
      console.log(`[warmup-jalan] page ${page} percobaan ${attempt} gagal (${err.message}) — tunggu ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function extractData(r) {
  if (Array.isArray(r)) return r;
  if (r && Array.isArray(r.data)) return r.data;
  return null;
}

/** Normalisasi satu baris API → nilai kolom tabel. */
function toRow(a) {
  return {
    id: a.id ?? 0,
    ticket_number: a.ticket_number ?? null,
    form_event_type: a.form_event_type ?? null,
    form_user_id: a.form_user_id ?? null,
    form_nik_number: a.form_nik_number ?? null,
    form_nip_number: a.form_nip_number ?? null,
    form_institution_name: a.form_institution_name ?? null,
    form_user_email: a.form_user_email ?? null,
    form_phone_number: a.form_phone_number ?? null,
    form_fullname: a.form_fullname ?? null,
    form_district_id: a.form_district_id ?? null,
    form_district_name: a.form_district_name ?? null,
    form_subdistrict_id: a.form_subdistrict_id ?? null,
    form_subdistrict_name: a.form_subdistrict_name ?? null,
    form_participant_type: a.form_participant_type ?? null,
    form_user_consent: a.form_user_consent == null ? null : a.form_user_consent ? 1 : 0,
    api_nik_number: a.api_nik_number ?? null,
    api_phone_number: a.api_phone_number ?? null,
    api_user_email: a.api_user_email ?? null,
    api_fullname: a.api_fullname ?? null,
    created_at: toMySqlDatetime(a.created_at),
  };
}

/** Ubah timestamp ISO (2025-11-08T03:35:14.590Z) → format DATETIME MySQL. */
function toMySqlDatetime(v) {
  if (!v) return null;
  if (typeof v !== "string") return v;
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(v);
  return m ? `${m[1]} ${m[2]}` : v;
}

async function upsertBatch(conn, rows) {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const placeholders = rows.map(() => `(${cols.map(() => "?").join(",")})`).join(",");
  const values = rows.flatMap((r) => cols.map((c) => r[c]));
  const update = cols
    .filter((c) => c !== "id")
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(", ");
  const sql = `INSERT INTO tb_event_jalan_sehat (\`${cols.join("`,`")}\`)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE ${update}`;
  const [res] = await conn.query(sql, values);
  return res.affectedRows ?? 0;
}

async function main() {
  const t0 = Date.now();
  console.log(`[warmup-jalan] mulai sync jalan sehat dari ${BASE} ...`);

  const allRows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const d = await fetchPage(page);
    const data = extractData(d);
    if (!data || data.length === 0) break;
    allRows.push(...data.map(toRow));
    console.log(`[warmup-jalan] page ${page} OK (+${data.length}, total ${allRows.length})`);
    if (data.length < LIMIT) break;
  }

  if (allRows.length === 0) throw new Error("Tidak ada data jalan sehat");

  console.log(`[warmup-jalan] total ${allRows.length} baris → upsert ke tb_event_jalan_sehat ...`);
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

  const [cnt] = await conn.query("SELECT COUNT(*) n FROM tb_event_jalan_sehat");
  console.log(
    `[warmup-jalan] selesai: ${allRows.length} baris diproses (affected ${affected}), ` +
      `total di tabel ${cnt[0].n} (${((Date.now() - t0) / 1000).toFixed(1)}s)`
  );
  await conn.end();
}

main().catch((err) => {
  console.error("[warmup-jalan] GAGAL:", err.message);
  process.exit(1);
});