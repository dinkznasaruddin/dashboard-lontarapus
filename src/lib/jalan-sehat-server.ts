/**
 * Modul server-only untuk data Jalan Sehat: sumber utama = tabel MySQL
 * `tb_event_jalan_sehat` (diisi/diperbarui oleh scripts/warmup-jalansantai.mjs
 * via cron atau sync background). Dashboard membaca dari DB, bukan dari API.
 *
 * Dipisah dari `jalan-sehat.ts` karena modul itu juga dipakai komponen client
 * (impor `fs`/`path`/db tidak boleh masuk bundel client).
 */

import "server-only";

import { pool } from "@/lib/db";
import {
  buildJalanSehatData,
  type JalanSehat,
  type JalanSehatData,
} from "@/lib/jalan-sehat";
import { fetchAllJalanSehat } from "@/lib/apis";

const CACHE_REVALIDATE = 600;

/** Cache di-memory (per-instance server) dengan TTL 10 menit.
 *  Data mentah ~10MB tidak bisa masuk unstable_cache (limit 2MB), jadi
 *  di-cache manual mirip file-cache pada dashboard lama. */
let rawCache: { items: JalanSehat[]; at: number } | null = null;
/** Promise refresh berjalan (anti dobel-sync saat bersamaan). */
let refreshing: Promise<JalanSehat[]> | null = null;

/** Baca seluruh baris tabel sebagai array JalanSehat. */
async function readAllFromDB(): Promise<JalanSehat[]> {
  const [rows] = await pool.query("SELECT * FROM tb_event_jalan_sehat");
  return rows as JalanSehat[];
}

/** Timestamp sync terakhir di DB (MAX updated_at) atau 0 jika tabel kosong. */
async function lastSyncedAt(): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(updated_at), '1970-01-01 00:00:00') AS t FROM tb_event_jalan_sehat"
  );
  const t = (rows as any[])[0]?.t;
  return new Date(String(t).replace(" ", "T")).getTime();
}

/** Jumlah baris di tabel (0 = belum pernah disync). */
async function dbRowCount(): Promise<number> {
  const [rows] = await pool.query("SELECT COUNT(*) AS n FROM tb_event_jalan_sehat");
  return Number((rows as any[])[0]?.n ?? 0);
}

/**
 * Sync penuh dari API → DB (dipakai background ataupun blocking pertama).
 * Dedup lewat `refreshing`. Setelah sukses, isi rawCache.
 */
async function refreshFromAPI(): Promise<JalanSehat[]> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    let items: JalanSehat[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        items = (await fetchAllJalanSehat()) as JalanSehat[];
      } catch (err) {
        console.error(`[jalan-sehat] fetchAllJalanSehat attempt ${attempt} failed:`, err);
        items = [];
      }
      if (items.length > 0) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    if (items.length > 0) {
      await upsertAll(items);
      rawCache = { items, at: Date.now() };
    }
    return items;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Upsert semua baris ke tabel (batch kecil; max_allowed_packet 1MB). */
async function upsertAll(items: JalanSehat[]) {
  const CHUNK = 100;
  const cols = [
    "id",
    "ticket_number",
    "form_event_type",
    "form_user_id",
    "form_nik_number",
    "form_nip_number",
    "form_institution_name",
    "form_user_email",
    "form_phone_number",
    "form_fullname",
    "form_district_id",
    "form_district_name",
    "form_subdistrict_id",
    "form_subdistrict_name",
    "form_participant_type",
    "form_user_consent",
    "api_nik_number",
    "api_phone_number",
    "api_user_email",
    "api_fullname",
    "created_at",
  ];

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => `(${cols.map(() => "?").join(",")})`).join(",");
    const values = chunk.flatMap((a) =>
      cols.map((c) => (a as any)[c] ?? null)
    );
    const update = cols
      .filter((c) => c !== "id")
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(", ");
    await pool.query(
      `INSERT INTO tb_event_jalan_sehat (\`${cols.join("`,`")}\`) VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE ${update}`,
      values
    );
  }
}

/**
 * Ambil data Jalan Sehat dengan strategi stale-while-revalidate dari DB:
 * 1. cache memory fresh → langsung
 * 2. DB fresh (sync < 10 menit lalu) → muat semua ke memory, langsung
 * 3. DB ada tapi basi → tampilkan data lama + trigger sync background
 *    (halaman tetap merespons cepat, tidak menunggu API)
 * 4. tabel belum pernah diisi → sync blocking (fetch API → DB)
 */
async function loadRaw(): Promise<JalanSehat[]> {
  if (rawCache && Date.now() - rawCache.at < CACHE_REVALIDATE * 1000) {
    return rawCache.items;
  }

  const count = await dbRowCount();
  if (count > 0) {
    const lastSync = await lastSyncedAt();
    const fresh = Date.now() - lastSync < CACHE_REVALIDATE * 1000;
    const items = await readAllFromDB();
    if (items.length > 0) {
      rawCache = { items, at: fresh ? Date.now() : lastSync };
      if (!fresh) {
        // Data basi → tampilkan dulu, sync di background (fire-and-forget).
        void refreshFromAPI();
      }
      return items;
    }
  }

  // Tabel kosong → sync blocking pertama kali.
  const items = await refreshFromAPI();
  return items;
}

/** Data mentah registrasi Jalan Sehat (dari DB, di-cache). */
export async function getAllJalanSehat(): Promise<JalanSehat[]> {
  return loadRaw();
}

/** Agregasi statistik (dihitung per-request dari data ter-cache — murah). */
export async function getJalanSehatData(): Promise<JalanSehatData> {
  const items = await loadRaw();
  return buildJalanSehatData(items);
}