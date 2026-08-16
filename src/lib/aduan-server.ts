/**
 * Modul server-only untuk data aduan: sumber utama = tabel MySQL
 * `tb_aduansync` (diisi/diperbarui oleh scripts/warmup-aduan.mjs via cron
 * atau sync background). Dashboard membaca dari DB, bukan dari API.
 *
 * Dipisah dari `aduan.ts` karena modul itu juga dipakai komponen client
 * (impor `fs`/`path`/db tidak boleh masuk bundel client).
 */

import "server-only";

import { fetchAllComplaints } from "@/lib/apis";
import {
  buildAggregasi,
  type Aduan,
  type AduanAggregasi,
} from "@/lib/aduan";
import { pool } from "@/lib/db";

const CACHE_REVALIDATE = 600;

/** Cache di-memory (per-instance server) dengan TTL 10 menit.
 *  Data mentah ~45MB tidak bisa masuk unstable_cache (limit 2MB), jadi
 *  di-cache manual mirip file-cache pada dashboard lama. */
let rawCache: { items: Aduan[]; at: number } | null = null;
/** Promise refresh berjalan (anti dobel-sync saat bersamaan). */
let refreshing: Promise<Aduan[]> | null = null;

/** Baca seluruh baris tabel sebagai array Aduan. */
async function readAllFromDB(): Promise<Aduan[]> {
  const [rows] = await pool.query("SELECT * FROM tb_aduansync");
  return rows as Aduan[];
}

/** Timestamp sync terakhir di DB (MAX updated_at) atau 0 jika tabel kosong. */
async function lastSyncedAt(): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(updated_at), '1970-01-01 00:00:00') AS t FROM tb_aduansync"
  );
  const t = (rows as any[])[0]?.t;
  return new Date(String(t).replace(" ", "T")).getTime();
}

/** Jumlah baris di tabel (0 = belum pernah disync). */
async function dbRowCount(): Promise<number> {
  const [rows] = await pool.query("SELECT COUNT(*) AS n FROM tb_aduansync");
  return Number((rows as any[])[0]?.n ?? 0);
}

/**
 * Sync penuh dari API → DB (dipakai background ataupun blocking pertama).
 * Dedup lewat `refreshing`. Setelah sukses, isi rawCache.
 */
async function refreshFromAPI(): Promise<Aduan[]> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    let items: Aduan[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        items = await fetchAllComplaints<Aduan>(CACHE_REVALIDATE);
      } catch (err) {
        console.error(`[aduan] fetchAllComplaints attempt ${attempt} failed:`, err);
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
async function upsertAll(items: Aduan[]) {
  const CHUNK = 100;
  const cols = [
    "ticketid",
    "Layanan",
    "waktu_aduan",
    "first_reply_date",
    "first_reply_message",
    "waktu_respon_opd",
    "opd_first_reply_message",
    "last_reply_date",
    "last_reply_message",
    "durasi_first_reply",
    "durasi_opd_response",
    "durasi_replies_first_last",
    "nama_pelapor",
    "pesan_aduan",
    "status",
    "kategori",
    "no_hp",
    "tanggal",
    "longlat",
    "alamat",
    "kecamatan",
    "kelurahan",
  ];

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => `(${cols.map(() => "?").join(",")})`).join(",");
    const values = chunk.flatMap((a) =>
      cols.map((c) => (a as any)[c] ?? null)
    );
    const update = cols
      .filter((c) => c !== "ticketid")
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(", ");
    await pool.query(
      `INSERT INTO tb_aduansync (\`${cols.join("`,`")}\`) VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE ${update}`,
      values
    );
  }
}

/**
 * Ambil data aduan dengan strategi stale-while-revalidate dari DB:
 * 1. cache memory fresh → langsung
 * 2. DB fresh (sync < 10 menit lalu) → muat semua ke memory, langsung
 * 3. DB ada tapi basi → tampilkan data lama + trigger sync background
 *    (halaman tetap merespons cepat, tidak menunggu API lambat)
 * 4. tabel belum pernah diisi → sync blocking (fetch API → DB)
 */
async function loadRaw(): Promise<Aduan[]> {
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

/** Data mentah aduan (dari DB, di-cache). */
export async function getAllAduan(): Promise<Aduan[]> {
  return loadRaw();
}

/** Agregasi statistik (dihitung per-request dari data ter-cache — murah). */
export async function getAduanData(): Promise<AduanAggregasi> {
  const items = await loadRaw();
  return buildAggregasi(items);
}

/**
 * Data khusus peta: baca LANGSUNG dari DB hanya kolom yang diperlukan dan
 * hanya baris ber-longlat, dengan filter (tahun/kategori/status) dilakukan
 * di SQL. Jauh lebih ringan daripada memuat seluruh ~45MB lalu memfilter di JS.
 */
export interface MapRow {
  ticketid: string;
  longlat: string;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  kategori: string;
  status: string;
  nama_pelapor: string;
  waktu_aduan: string;
  no_hp: string;
  pesan_aduan: string;
}

export async function queryMapRows(filter: {
  year?: number;
  kategori?: string;
  status?: string;
}): Promise<MapRow[]> {
  const where: string[] = [
    "longlat IS NOT NULL",
    "longlat != ''",
    "longlat != '0'",
  ];
  const params: string[] = [];
  if (filter.year) {
    where.push("LEFT(waktu_aduan, 4) = ?");
    params.push(String(filter.year));
  }
  if (filter.kategori) {
    where.push("kategori = ?");
    params.push(filter.kategori);
  }
  if (filter.status) {
    where.push("status = ?");
    params.push(filter.status);
  }

  const [rows] = await pool.query(
    `SELECT ticketid, longlat, alamat, kecamatan, kelurahan, kategori, status,
            nama_pelapor, waktu_aduan, no_hp, pesan_aduan
     FROM tb_aduansync
     WHERE ${where.join(" AND ")}
     ORDER BY waktu_aduan DESC
     LIMIT 20000`,
    params
  );
  return rows as MapRow[];
}