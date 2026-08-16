/* -------------------------------------------------------------------------- */
/*  Tipe data ASN (sumber: tabel db_asn) + index Jalan Sehat                  */
/* -------------------------------------------------------------------------- */

export interface Asn {
  no: number;
  nama?: string | null;
  ttl?: string | null;
  nip?: string | null;
  satuan_kerja?: string | null;
  unit_kerja?: string | null;
  eselon?: string | null;
  status_pegawai?: string | null;
  nama_jabatan?: string | null;
  no_ktp?: string | null;
  nip_pppk?: string | null;
  nip_pns?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Util                                                                      */
/* -------------------------------------------------------------------------- */

/** Hanya 18 digit. */
export function normalizeNIP(nip: unknown): string {
  const digits = String(nip ?? "").replace(/\D+/g, "");
  return digits.length === 18 ? digits : "";
}

/** Hanya 16 digit (NIK). */
export function normalizeNIK(nik: unknown): string {
  const digits = String(nik ?? "").trim();
  return digits.length === 16 && /^\d+$/.test(digits) ? digits : "";
}

/** Sensor NIK/NIP: tampilkan 6 digit awal + 6 digit akhir, tengah ****. */
export function censorID(v?: string | null, fallback = "-"): string {
  const s = String(v ?? "").trim();
  if (!s || s === "-") return fallback;
  const len = s.length;
  if (len >= 10) return `${s.slice(0, 6)}****${s.slice(-6)}`;
  if (len >= 4) {
    const visible = Math.floor((len - 4) / 2);
    return `${s.slice(0, visible)}****${s.slice(-visible)}`;
  }
  return s;
}

const LOWERCASE_WORDS = ["dan", "di", "ke", "dari", "untuk", "pada", "atau", "yang"];

/** Title case sederhana (sama dengan formatTitleCase pada PHP lama). */
export function formatTitleCase(text?: string | null): string {
  const t = String(text ?? "").toLowerCase();
  if (!t) return "-";
  return t
    .split(" ")
    .map((word, i) => (i === 0 || !LOWERCASE_WORDS.includes(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Cari NIP (18 digit) pertama dari payload registrasi (scan keys + nested). */
export function extractNIPFromRegistration(reg: Record<string, unknown>): string {
  const candidateKeys = [
    "nip", "api_nip", "api_nip_number", "nip_number", "nip_baru", "nip_lama",
    "pegawai_nip", "asn_nip", "nip18",
  ];
  for (const k of candidateKeys) {
    const n = normalizeNIP(reg[k]);
    if (n !== "") return n;
  }
  const stack: unknown[] = [reg];
  while (stack.length) {
    const curr = stack.pop();
    if (Array.isArray(curr)) {
      for (const v of curr) {
        if (Array.isArray(v) || (v && typeof v === "object")) stack.push(v);
        else if (typeof v === "string") {
          const n = normalizeNIP(v);
          if (n !== "") return n;
        }
      }
    }
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/*  Index Jalan Sehat                                                         */
/* -------------------------------------------------------------------------- */

export interface JalanSehatIndex {
  nik: Set<string>;
  nip: Set<string>;
}

/** Bangun index NIK (api_nik_number) + NIP (best-effort) dari data jalan sehat. */
export function buildJalanSehatIndex(items: { api_nik_number?: string | null; form_nip_number?: string | null }[]): JalanSehatIndex {
  const nik = new Set<string>();
  const nip = new Set<string>();
  for (const p of items) {
    const nk = normalizeNIK(p.api_nik_number);
    if (nk) nik.add(nk);
    const np = normalizeNIP(p.form_nip_number);
    if (np) nip.add(np);
  }
  return { nik, nip };
}

/** True jika ASN terdaftar di Jalan Sehat (via NIK atau NIP). */
export function isRegistered(index: JalanSehatIndex, asn: Asn): boolean {
  const nik = normalizeNIK(asn.no_ktp);
  if (nik && index.nik.has(nik)) return true;
  const nip = normalizeNIP(asn.nip);
  if (nip && index.nip.has(nip)) return true;
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Agregasi                                                                  */
/* -------------------------------------------------------------------------- */

export interface SatkerRekap {
  nama_satker: string;
  total_asn: number;
  terdaftar: number;
  belum_daftar: number;
  persentase: number;
}

export interface StatusRekap {
  status: string;
  jumlah: number;
  terdaftar: number;
  persentase: number;
}

export interface AsnData {
  totalASN: number;
  asnTerdaftar: number;
  asnBelumDaftar: number;
  persentase: number;
  satkerRekap: SatkerRekap[];
  statusRekap: StatusRekap[];
  totalPerStatus: number;
  /** Opsi satuan kerja untuk filter tabel (urut nama). */
  satkerOptions: { label: string; count: number }[];
  fetchedAt: string;
}

/** Dapatkan ASN yang valid: memiliki NIK & NIP (sama seperti PHP lama). */
export function isValidAsn(asn: Asn): boolean {
  return !!(asn.no_ktp && asn.no_ktp !== "" && asn.nip && asn.nip !== "");
}

/** Hitung ringkasan dashboard (mirip data-asn.php). */
export function buildAsnData(all: Asn[], index: JalanSehatIndex): AsnData {
  const valid = all.filter(isValidAsn);

  // Distinct NIP (RAW, termasuk 16-digit LASKAR) — sama seperti COUNT(DISTINCT nip) PHP.
  const totalNipSet = new Set<string>();
  for (const a of valid) {
    const nip = String(a.nip ?? "").trim();
    if (nip) totalNipSet.add(nip);
  }
  const totalASN = totalNipSet.size;

  // Berapa ASN terdaftar (distinct NIP raw)
  const terdaftarNipSet = new Set<string>();
  for (const a of valid) {
    if (isRegistered(index, a)) {
      const nip = String(a.nip ?? "").trim();
      if (nip) terdaftarNipSet.add(nip);
    }
  }
  const asnTerdaftar = terdaftarNipSet.size;
  const asnBelumDaftar = totalASN - asnTerdaftar;
  const persentase = totalASN > 0 ? (asnTerdaftar / totalASN) * 100 : 0;

  // Rekap per satuan kerja (distinct NIP raw per satker)
  const satkerMap = new Map<string, SatkerRekap>();
  const satkerNips = new Map<string, Set<string>>();
  for (const a of valid) {
    const raw = (a.satuan_kerja ?? "").trim();
    if (!raw) continue;
    const key = raw.replace(/\s+/g, " ").toLowerCase();
    let d = satkerMap.get(key);
    if (!d) {
      d = { nama_satker: raw, total_asn: 0, terdaftar: 0, belum_daftar: 0, persentase: 0 };
      satkerMap.set(key, d);
      satkerNips.set(key, new Set());
    }
    const nip = String(a.nip ?? "").trim();
    if (!nip || satkerNips.get(key)!.has(nip)) continue;
    satkerNips.get(key)!.add(nip);
    d.total_asn++;
    if (isRegistered(index, a)) d.terdaftar++;
  }
  const satkerRekap = [...satkerMap.values()]
    .map((d) => {
      d.belum_daftar = d.total_asn - d.terdaftar;
      d.persentase = d.total_asn > 0 ? (d.terdaftar / d.total_asn) * 100 : 0;
      return d;
    })
    .sort((a, b) => b.persentase - a.persentase);

  // Rekap per status pegawai (distinct NIP raw per status)
  const statusMap = new Map<string, { jumlah: number; terdaftar: number }>();
  const statusNips = new Map<string, Set<string>>();
  for (const a of valid) {
    const status = (a.status_pegawai ?? "").trim();
    if (!status) continue;
    const d = statusMap.get(status) ?? { jumlah: 0, terdaftar: 0 };
    const nips = statusNips.get(status) ?? new Set<string>();
    const nip = String(a.nip ?? "").trim();
    if (nip && !nips.has(nip)) {
      nips.add(nip);
      d.jumlah++;
      if (isRegistered(index, a)) d.terdaftar++;
      statusMap.set(status, d);
      statusNips.set(status, nips);
    }
  }
  const statusRekap = [...statusMap.entries()]
    .map(([status, d]) => ({
      status,
      jumlah: d.jumlah,
      terdaftar: d.terdaftar,
      persentase: d.jumlah > 0 ? (d.terdaftar / d.jumlah) * 100 : 0,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);
  const totalPerStatus = statusRekap.reduce((s, x) => s + x.jumlah, 0);

  const satkerOptions = [...satkerMap.values()]
    .sort((a, b) => a.nama_satker.localeCompare(b.nama_satker))
    .map((d) => ({ label: d.nama_satker, count: d.total_asn }));

  return {
    totalASN,
    asnTerdaftar,
    asnBelumDaftar,
    persentase,
    satkerRekap,
    statusRekap,
    totalPerStatus,
    satkerOptions,
    fetchedAt: new Date().toISOString(),
  };
}