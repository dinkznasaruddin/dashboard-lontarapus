/* -------------------------------------------------------------------------- */
/*  Tipe data registrasi Jalan Sehat (sumber: tb_event_jalan_sehat)          */
/* -------------------------------------------------------------------------- */

export interface JalanSehat {
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

/** Normalisasi tipe peserta: selain ASN dianggap Masyarakat (termasuk "umum"). */
export function normalizeParticipantType(type?: string | null): "asn" | "masyarakat" {
  return (type ?? "").toLowerCase() === "asn" ? "asn" : "masyarakat";
}

/** Nama terbaik: data API lebih lengkap, fallback ke data form. */
export function bestName(r: JalanSehat): string {
  return r.api_fullname || r.form_fullname || "-";
}

/** NIK terbaik. */
export function bestNik(r: JalanSehat): string {
  return r.api_nik_number || r.form_nik_number || "-";
}

/** Email terbaik. */
export function bestEmail(r: JalanSehat): string {
  return r.api_user_email || r.form_user_email || "-";
}

/** No. HP terbaik. */
export function bestPhone(r: JalanSehat): string {
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

export interface KelurahanDetail {
  kelurahan: string;
  kecamatan: string;
  asn: number;
  masyarakat: number;
  total: number;
}

export interface InstansiDetail {
  instansi: string;
  asn: number;
  masyarakat: number;
  total: number;
}

export interface JalanSehatData {
  total: number;
  hariIni: number;
  asn: number;
  masyarakat: number;
  /** Semua kecamatan, urut descending jumlah. */
  districtCounts: { label: string; value: number }[];
  /** Detail per kelurahan, urut nama kecamatan ascending. */
  kelurahanDetails: KelurahanDetail[];
  /** Detail per instansi, urut jumlah ASN descending. */
  instansiDetails: InstansiDetail[];
  /** Distrik yang punya data (untuk filter tabel). */
  districtOptions: { label: string; count: number }[];
  /** Instansi yang punya data (untuk filter tabel). */
  instansiOptions: { label: string; count: number }[];
  fetchedAt: string;
}

export function buildJalanSehatData(items: JalanSehat[]): JalanSehatData {
  const today = dateOnly(new Date().toISOString());
  let hariIni = 0;
  let asn = 0;
  let masyarakat = 0;
  const districtM = new Map<string, number>();
  const kelurahanM = new Map<string, KelurahanDetail>();
  const instansiM = new Map<string, InstansiDetail>();

  for (const r of items) {
    if (dateOnly(r.created_at) === today) hariIni++;

    const type = normalizeParticipantType(r.form_participant_type);
    if (type === "asn") asn++;
    else masyarakat++;

    const kec = (r.form_district_name ?? "").trim();
    if (kec) districtM.set(kec, (districtM.get(kec) ?? 0) + 1);

    const kel = (r.form_subdistrict_name ?? "").trim();
    if (kel) {
      let d = kelurahanM.get(kel);
      if (!d) {
        d = { kelurahan: kel, kecamatan: kec || "-", asn: 0, masyarakat: 0, total: 0 };
        kelurahanM.set(kel, d);
      }
      d.total++;
      if (type === "asn") d.asn++;
      else d.masyarakat++;
    }

    const inst = (r.form_institution_name ?? "").trim();
    if (inst) {
      let d = instansiM.get(inst);
      if (!d) {
        d = { instansi: inst, asn: 0, masyarakat: 0, total: 0 };
        instansiM.set(inst, d);
      }
      d.total++;
      if (type === "asn") d.asn++;
      else d.masyarakat++;
    }
  }

  const districtCounts = [...districtM.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const kelurahanDetails = [...kelurahanM.values()].sort((a, b) =>
    a.kecamatan.localeCompare(b.kecamatan)
  );

  const instansiDetails = [...instansiM.values()].sort((a, b) => b.asn - a.asn);

  return {
    total: items.length,
    hariIni,
    asn,
    masyarakat,
    districtCounts,
    kelurahanDetails,
    instansiDetails,
    districtOptions: districtCounts.map((d) => ({ label: d.label, count: d.value })),
    instansiOptions: instansiDetails.map((d) => ({ label: d.instansi, count: d.total })),
    fetchedAt: new Date().toISOString(),
  };
}