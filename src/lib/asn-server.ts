/**
 * Modul server-only untuk data pegawai (ASN): sumber utama = tabel MySQL
 * `db_asn` + data Jalan Sehat dari `tb_event_jalan_sehat` (untuk index
 * NIK/NIP yang sudah mendaftar). Dashboard membaca dari DB, bukan dari API.
 *
 * Dipisah dari `asn.ts` karena modul itu juga dipakai komponen client
 * (impor `fs`/`path`/db tidak boleh masuk bundel client).
 */

import "server-only";

import { pool } from "@/lib/db";
import {
  buildAsnData,
  buildJalanSehatIndex,
  censorID,
  formatTitleCase,
  isRegistered,
  normalizeNIK,
  normalizeNIP,
  type Asn,
  type AsnData,
  type JalanSehatIndex,
} from "@/lib/asn";
import { getAllJalanSehat } from "@/lib/jalan-sehat-server";

const CACHE_REVALIDATE = 600;

/** Cache di-memory (per-instance server) dengan TTL 10 menit. */
let cache: { data: AsnData; at: number } | null = null;
let allAsnCache: { items: Asn[]; at: number } | null = null;

/** Baca seluruh baris db_asn. */
async function readAllAsn(): Promise<Asn[]> {
  const [rows] = await pool.query("SELECT * FROM db_asn");
  return rows as Asn[];
}

/** Ambil semua ASN (cache memory 10 menit). */
async function getAllAsn(): Promise<Asn[]> {
  if (allAsnCache && Date.now() - allAsnCache.at < CACHE_REVALIDATE * 1000) {
    return allAsnCache.items;
  }
  const items = await readAllAsn();
  allAsnCache = { items, at: Date.now() };
  return items;
}

/** Ringkasan dashboard (rekap satker + status + stat). */
export async function getAsnData(): Promise<AsnData> {
  if (cache && Date.now() - cache.at < CACHE_REVALIDATE * 1000) {
    return cache.data;
  }
  const [all, jalanSehat] = await Promise.all([getAllAsn(), getAllJalanSehat()]);
  const index = buildJalanSehatIndex(jalanSehat);
  const data = buildAsnData(all, index);
  cache = { data, at: Date.now() };
  return data;
}

/** Index NIK/NIP jalan sehat (dipakai untuk status terdaftar di tabel). */
export async function getJalanSehatIndex(): Promise<JalanSehatIndex> {
  const jalanSehat = await getAllJalanSehat();
  return buildJalanSehatIndex(jalanSehat);
}

/* -------------------------------------------------------------------------- */
/*  Tabel pegawai (paginasi server-side, seperti get_asn_data.php)           */
/* -------------------------------------------------------------------------- */

export interface AsnTableRow {
  no: number;
  nama: string;
  nip: string;
  nipCensored: string;
  satuan_kerja: string;
  unit_kerja: string;
  status_pegawai: string;
  no_ktp: string;
  no_ktpCensored: string;
  terdaftar: boolean;
}

export interface AsnTableResult {
  rows: AsnTableRow[];
  total: number;
  filtered: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Ambil halaman data pegawai dengan filter (mirip get_asn_data.php):
 * - filterStatus: "" | "sudah" | "belum"
 * - filterSatker: nama satuan kerja eksak
 * - search: nama/nip/satker/unit/status/nik/status js
 */
export async function queryAsnTable(opts: {
  page: number;
  perPage: number;
  filterStatus?: string;
  filterSatker?: string;
  search?: string;
}): Promise<AsnTableResult> {
  const all = await getAllAsn();
  const index = await getJalanSehatIndex();

  const perPage = Math.max(1, opts.perPage);
  const page = Math.max(1, opts.page);
  const filterStatus = opts.filterStatus ?? "";
  const filterSatker = opts.filterSatker ?? "";
  const search = (opts.search ?? "").trim().toLowerCase();

  // Hanya ASN valid (NIK & NIP) — sesuai implementasi PHP.
  const valid = all.filter((a) => a.no_ktp && a.no_ktp !== "" && a.nip && a.nip !== "");

  const filtered = valid.filter((a) => {
    const terdaftar = isRegistered(index, a);
    if (filterStatus === "sudah" && !terdaftar) return false;
    if (filterStatus === "belum" && terdaftar) return false;
    if (filterSatker && a.satuan_kerja !== filterSatker) return false;
    if (search) {
      const hay = [
        a.nama,
        a.nip,
        normalizeNIP(a.nip),
        a.satuan_kerja,
        a.unit_kerja,
        a.status_pegawai,
        a.no_ktp,
        normalizeNIK(a.no_ktp),
        terdaftar ? "sudah daftar" : "belum daftar",
        terdaftar ? "sudah" : "belum",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const total = valid.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const rows: AsnTableRow[] = pageItems.map((a) => {
    const nip = normalizeNIP(a.nip) || String(a.nip ?? "");
    const nik = String(a.no_ktp ?? "");
    return {
      no: a.no,
      nama: a.nama ?? "-",
      nip,
      nipCensored: censorID(a.nip),
      satuan_kerja: formatTitleCase(a.satuan_kerja),
      unit_kerja: a.unit_kerja ?? "-",
      status_pegawai: a.status_pegawai ?? "-",
      no_ktp: nik,
      no_ktpCensored: censorID(a.no_ktp),
      terdaftar: isRegistered(index, a),
    };
  });

  return { rows, total, filtered: filtered.length, page: cur, perPage, totalPages };
}

/** Hapus cache (dipakai saat warmup agar data segar). */
export function invalidateAsnCache() {
  cache = null;
  allAsnCache = null;
}