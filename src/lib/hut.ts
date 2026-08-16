/* -------------------------------------------------------------------------- */
/*  Tipe data registrasi HUT Kota Makassar (sumber: tb_event_hut)            */
/* -------------------------------------------------------------------------- */

export interface Hut {
  id: number;
  ticket_number?: string | null;
  form_event_type?: string | null;
  form_user_id?: string | null;
  form_nik_number?: string | null;
  form_nip_number?: string | null;
  form_institution_name?: string | null;
  form_user_email?: string | null;
  form_phone_number?: string | null;
  form_fullname?: string | null;
  form_district_id?: string | null;
  form_district_name?: string | null;
  form_subdistrict_id?: string | null;
  form_subdistrict_name?: string | null;
  form_participant_type?: string | null;
  form_user_consent?: number | null;
  api_nik_number?: string | null;
  api_phone_number?: string | null;
  api_user_email?: string | null;
  api_fullname?: string | null;
  created_at?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Util                                                                      */
/* -------------------------------------------------------------------------- */

/** Nama terbaik: data API lebih lengkap, fallback ke data form. */
export function bestName(r: Hut): string {
  return r.api_fullname || r.form_fullname || "-";
}

/** NIK terbaik. */
export function bestNik(r: Hut): string {
  return r.api_nik_number || r.form_nik_number || "-";
}

/** Email terbaik. */
export function bestEmail(r: Hut): string {
  return r.api_user_email || r.form_user_email || "-";
}

/** No. HP terbaik. */
export function bestPhone(r: Hut): string {
  return r.api_phone_number || r.form_phone_number || "-";
}

/** Tanggal `created_at` (YYYY-MM-DD HH:MM:SS) → Date lokal. */
export function parseCreatedAt(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(String(v).replace(" ", "T"));
  return isNaN(+d) ? null : d;
}

/** Format tanggal daftar → dd/mm/yyyy HH:mm (seperti dashboard lama). */
export function formatCreatedAt(v?: string | null): string {
  const d = parseCreatedAt(v);
  if (!d) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/** Tanggal untuk perbandingan harian (YYYY-MM-DD). */
export function dateOnly(v?: string | null): string {
  const d = parseCreatedAt(v);
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Agregasi                                                                  */
/* -------------------------------------------------------------------------- */

export interface KelurahanRow {
  kelurahan: string;
  total: number;
}

export interface HutData {
  total: number;
  hariIni: number;
  /** Semua kecamatan, urut descending jumlah. */
  districtCounts: { label: string; value: number }[];
  /** Detail per kelurahan, urut total descending. */
  kelurahanRows: KelurahanRow[];
  /** Distrik yang punya data (untuk filter tabel). */
  districtOptions: { label: string; count: number }[];
  fetchedAt: string;
}

export function buildHutData(items: Hut[]): HutData {
  const today = dateOnly(new Date().toISOString());
  let hariIni = 0;
  const districtM = new Map<string, number>();
  const kelurahanM = new Map<string, number>();

  for (const r of items) {
    if (dateOnly(r.created_at) === today) hariIni++;

    const kec = (r.form_district_name ?? "").trim();
    if (kec) districtM.set(kec, (districtM.get(kec) ?? 0) + 1);

    const kel = (r.form_subdistrict_name ?? "").trim();
    if (kel) kelurahanM.set(kel, (kelurahanM.get(kel) ?? 0) + 1);
  }

  const districtCounts = [...districtM.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const kelurahanRows = [...kelurahanM.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kelurahan, total]) => ({ kelurahan, total }));

  return {
    total: items.length,
    hariIni,
    districtCounts,
    kelurahanRows,
    districtOptions: districtCounts.map((d) => ({ label: d.label, count: d.value })),
    fetchedAt: new Date().toISOString(),
  };
}