/* -------------------------------------------------------------------------- */
/*  Tipe data                                                                */
/* -------------------------------------------------------------------------- */

export interface Aduan {
  ticketid?: number | string;
  Layanan?: string | null;
  waktu_aduan?: string;
  first_reply_date?: string | null;
  first_reply_message?: string | null;
  waktu_respon_opd?: string | null;
  opd_first_reply_message?: string | null;
  last_reply_date?: string | null;
  last_reply_message?: string | null;
  durasi_first_reply?: string | null;
  durasi_opd_response?: string | null;
  durasi_replies_first_last?: string | null;
  nama_pelapor?: string;
  pesan_aduan?: string;
  status?: string;
  kategori?: string;
  no_hp?: string;
  tanggal?: string;
  longlat?: string;
  alamat?: string;
  kecamatan?: string;
  kelurahan?: string;
}

/* -------------------------------------------------------------------------- */
/*  Util                                                                      */
/* -------------------------------------------------------------------------- */

/** Normalisasi kategori (merge PJU & Lampu Jalan, Pipa PDAM & Layanan PDAM). */
export function normalizeKategori(kategori?: string): string {
  if (kategori === "PJU" || kategori === "Lampu Jalan") return "Lampu Jalan";
  if (kategori === "Pipa PDAM Bocor" || kategori === "Layanan PDAM") return "Layanan PDAM";
  return kategori || "Unknown";
}

function toMinutes(durasi?: string | null): number | null {
  if (!durasi) return null;
  const m = /^(\d+):(\d+)$/.exec(durasi.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Kategori durasi first reply (semua aduan). */
export function kategoriFirstReply(durasi?: string | null): string {
  const mins = toMinutes(durasi);
  if (mins === null) return "Tidak Ada Data";
  if (mins <= 60) return "≤ 1 Jam";
  if (mins <= 360) return "1-6 Jam";
  if (mins <= 1440) return "6-24 Jam";
  return "> 24 Jam";
}

/** Kategori durasi penyelesaian (hanya Closed). */
export function kategoriPenyelesaian(durasi?: string | null, status?: string): string {
  if (status !== "Closed") return "Belum Selesai";
  const mins = toMinutes(durasi);
  if (mins === null) return "Tidak Ada Data";
  if (mins <= 480) return "≤ 8 Jam";
  if (mins <= 1440) return "8-24 Jam";
  if (mins <= 4320) return "1-3 Hari";
  return "> 3 Hari";
}

/** Kategori durasi first reply dalam format Inggris (padanan categorizeDuration). */
export function categorizeDurationEn(durasi?: string | null): string {
  const mins = toMinutes(durasi);
  if (mins === null) return "No Data";
  if (mins <= 60) return "Very Fast";
  if (mins <= 360) return "Fast";
  if (mins <= 1440) return "Medium";
  return "Slow";
}

/** Kategori durasi penyelesaian dalam format Inggris (padanan categorizeCompletionDuration). */
export function categorizeCompletionEn(durasi?: string | null, status?: string): string {
  if (status !== "Closed") return "Not Completed";
  const mins = toMinutes(durasi);
  if (mins === null) return "No Data";
  if (mins <= 480) return "Very Fast";
  if (mins <= 1440) return "Fast";
  if (mins <= 4320) return "Medium";
  return "Slow";
}

/** Format menit menjadi "HH:MM", "N hari HH:MM", atau "--". */
export function formatMenit(totalMenit: number): string {
  if (totalMenit <= 0) return "--";
  const total = Math.round(totalMenit);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    if (days === 1) return `1 hari ${String(rem).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return `${days} hari ${String(rem).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/* -------------------------------------------------------------------------- */
/*  Agregasi                                                                  */
/* -------------------------------------------------------------------------- */

export interface LayananStat {
  layanan: string;
  count: number;
  persen: number;
  avgFirstReply: string;
  avgOpdResponse: string;
  avgPenyelesaian: string;
}

export interface AduanAggregasi {
  total: number;
  hariIni: number;
  kemarin: number;
  bulanIni: number;
  bulanLalu: number;
  tahunIni: number;
  tahunLalu: number;
  availableYears: number[];
  statusCounts: { label: string; value: number }[];
  kategoriCounts: { label: string; value: number }[];
  kecamatanCounts: { label: string; value: number }[];
  layananStats: LayananStat[];
  durasiFirstReply: { label: string; value: number }[];
  durasiPenyelesaian: { label: string; value: number }[];
  /** 200 aduan terbaru untuk tabel. */
  recent: Aduan[];
  fetchedAt: string;
}

export function buildAggregasi(items: Aduan[]): AduanAggregasi {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterdayD = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayStr = `${yesterdayD.getFullYear()}-${String(yesterdayD.getMonth() + 1).padStart(2, "0")}-${String(yesterdayD.getDate()).padStart(2, "0")}`;
  const monthStr = todayStr.slice(0, 7);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  const yearStr = todayStr.slice(0, 4);
  const lastYear = today.getFullYear() - 1;

  let hariIni = 0, kemarin = 0, bulanIni = 0, bulanLalu = 0, tahunIni = 0, tahunLalu = 0;
  const years = new Set<number>();
  const statusM = new Map<string, number>();
  const kategoriM = new Map<string, number>();
  const kecamatanM = new Map<string, number>();
  const layananCountM = new Map<string, number>();
  const layananFirstM = new Map<string, { sum: number; n: number }>();
  const layananOpdM = new Map<string, { sum: number; n: number }>();
  const layananSelesaiM = new Map<string, { sum: number; n: number }>();
  const durasiFR: Record<string, number> = {};
  const durasiPen: Record<string, number> = {};

  for (const a of items) {
    const raw = a.waktu_aduan ?? "";
    const w = raw.slice(0, 10);
    if (w === todayStr) hariIni++;
    if (w === yesterdayStr) kemarin++;
    if (raw.slice(0, 7) === monthStr) bulanIni++;
    if (raw.slice(0, 7) === lastMonthStr) bulanLalu++;
    if (raw.slice(0, 4) === yearStr) tahunIni++;
    if (raw.slice(0, 4) === String(lastYear)) tahunLalu++;
    const t = raw ? new Date(raw.replace(" ", "T")) : null;
    if (t && !isNaN(+t)) years.add(t.getFullYear());

    const status = a.status || "Unknown";
    statusM.set(status, (statusM.get(status) ?? 0) + 1);

    const kat = normalizeKategori(a.kategori);
    kategoriM.set(kat, (kategoriM.get(kat) ?? 0) + 1);

    const kec = a.kecamatan || "Unknown";
    kecamatanM.set(kec, (kecamatanM.get(kec) ?? 0) + 1);

    const layanan = a.Layanan || "Unknown";
    layananCountM.set(layanan, (layananCountM.get(layanan) ?? 0) + 1);

    const fr = toMinutes(a.durasi_first_reply);
    if (fr !== null) {
      const acc = layananFirstM.get(layanan) ?? { sum: 0, n: 0 };
      acc.sum += fr; acc.n++;
      layananFirstM.set(layanan, acc);
    }
    const opd = toMinutes(a.durasi_opd_response);
    if (opd !== null) {
      const acc = layananOpdM.get(layanan) ?? { sum: 0, n: 0 };
      acc.sum += opd; acc.n++;
      layananOpdM.set(layanan, acc);
    }
    const pen = toMinutes(a.durasi_replies_first_last);
    if (pen !== null && a.status === "Closed") {
      const acc = layananSelesaiM.get(layanan) ?? { sum: 0, n: 0 };
      acc.sum += pen; acc.n++;
      layananSelesaiM.set(layanan, acc);
    }

    const dk = kategoriFirstReply(a.durasi_first_reply);
    durasiFR[dk] = (durasiFR[dk] ?? 0) + 1;
    const dp = kategoriPenyelesaian(a.durasi_replies_first_last, a.status);
    durasiPen[dp] = (durasiPen[dp] ?? 0) + 1;
  }

  const sortDesc = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  const totalLayanan = items.length || 1;
  const layananStats: LayananStat[] = [...layananCountM.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([layanan, count]) => {
      const f = layananFirstM.get(layanan);
      const o = layananOpdM.get(layanan);
      const s = layananSelesaiM.get(layanan);
      return {
        layanan,
        count,
        persen: (count / totalLayanan) * 100,
        avgFirstReply: f && f.n ? formatMenit(f.sum / f.n) : "--",
        avgOpdResponse: o && o.n ? formatMenit(o.sum / o.n) : "--",
        avgPenyelesaian: s && s.n ? formatMenit(s.sum / s.n) : "--",
      };
    });

  const durasiPenOrder = ["Belum Selesai", "≤ 8 Jam", "8-24 Jam", "1-3 Hari", "> 3 Hari", "Tidak Ada Data"];
  const durasiPenyelesaian = durasiPenOrder
    .filter((k) => durasiPen[k])
    .map((k) => ({ label: k, value: durasiPen[k] }))
    .concat(Object.entries(durasiPen).filter(([k]) => !durasiPenOrder.includes(k)).map(([label, value]) => ({ label, value })));

  const durasiFROrder = ["≤ 1 Jam", "1-6 Jam", "6-24 Jam", "> 24 Jam", "Tidak Ada Data"];
  const durasiFirstReply = durasiFROrder
    .filter((k) => durasiFR[k])
    .map((k) => ({ label: k, value: durasiFR[k] }))
    .concat(Object.entries(durasiFR).filter(([k]) => !durasiFROrder.includes(k)).map(([label, value]) => ({ label, value })));

  return {
    total: items.length,
    hariIni,
    kemarin,
    bulanIni,
    bulanLalu,
    tahunIni,
    tahunLalu,
    availableYears: [...years].sort((a, b) => b - a),
    statusCounts: sortDesc(statusM),
    kategoriCounts: sortDesc(kategoriM),
    kecamatanCounts: sortDesc(kecamatanM),
    layananStats,
    durasiFirstReply,
    durasiPenyelesaian,
    recent: [...items]
      .sort((a, b) => String(b.waktu_aduan ?? "").localeCompare(String(a.waktu_aduan ?? "")))
      .slice(0, 200),
    fetchedAt: new Date().toISOString(),
  };
}

/** Hitung per-bulan untuk tahun tertentu. */
export function monthlyForYear(agg: AduanAggregasi, all: Aduan[], year: number) {
  const out = Array.from({ length: 12 }, (_, i) => ({ bulan: i + 1, total: 0, selesai: 0, proses: 0 }));
  for (const a of all) {
    const raw = a.waktu_aduan ?? "";
    const m = Number(raw.slice(5, 7));
    const y = Number(raw.slice(0, 4));
    if (!(m >= 1 && m <= 12) || y !== year) continue;
    out[m - 1].total++;
    if (a.status === "Closed") out[m - 1].selesai++;
    else out[m - 1].proses++;
  }
  return out;
}

/** Hitung per-hari untuk bulan & tahun tertentu. */
export function dailyForMonth(agg: AduanAggregasi, all: Aduan[], year: number, month: number) {
  const days = new Date(year, month, 0).getDate();
  const out = Array(days).fill(0) as number[];
  for (const a of all) {
    const raw = a.waktu_aduan ?? "";
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(5, 7));
    const d = Number(raw.slice(8, 10));
    if (y === year && m === month) {
      out[d - 1]++;
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Agregasi per OPD/Layanan (dashboard-aduan-opd.php)                        */
/* -------------------------------------------------------------------------- */

export interface OpdStatusCounts {
  Selesai: number;
  Proses: number;
  Pending: number;
  Ditolak: number;
  Menunggu: number;
  Closed: number;
}

export interface OpdRow {
  layanan: string;
  total: number;
  statusCounts: Record<string, number>;
  completionCount: number;
  avgCompletionMinutes: number | null;
  avgCompletionTime: string;
  responseCount: number;
  avgResponseMinutes: number | null;
  avgResponseTime: string;
}

export interface OpdData {
  totalAduan: number;
  rows: OpdRow[];
  globalAvgCompletionTime: string;
  globalCompletionCount: number;
  globalAvgResponseTime: string;
  globalResponseCount: number;
  topOpd: string;
  topCount: number;
  /** Top 15 by jumlah aduan (untuk chart). */
  chartByCount: { label: string; value: number }[];
  /** Top 15 tercepat penyelesaian (menit). */
  chartFastest: { label: string; value: number; formatted: string }[];
  /** Top 15 terlama penyelesaian (menit). */
  chartSlowest: { label: string; value: number; formatted: string }[];
}

const OPD_STATUS_KEYS = ["Selesai", "Proses", "Pending", "Ditolak", "Menunggu", "Closed"];

export interface GroupedRow {
  name: string;
  total: number;
  statusCounts: Record<string, number>;
  completionCount: number;
  avgCompletionMinutes: number | null;
  avgCompletionTime: string;
  responseCount: number;
  avgResponseMinutes: number | null;
  avgResponseTime: string;
}

export interface GroupedData {
  totalAduan: number;
  rows: GroupedRow[];
  globalAvgCompletionTime: string;
  globalCompletionCount: number;
  globalAvgResponseTime: string;
  globalResponseCount: number;
  topName: string;
  topCount: number;
  chartByCount: { label: string; value: number }[];
  chartFastest: { label: string; value: number; formatted: string }[];
  chartSlowest: { label: string; value: number; formatted: string }[];
}

function buildGroupedData(
  items: Aduan[],
  keyOf: (a: Aduan) => string
): GroupedData {
  const map = new Map<string, GroupedRow>();
  let totalAduan = 0;
  let globalCompletionSum = 0;
  let globalCompletionCount = 0;
  let globalResponseSum = 0;
  let globalResponseCount = 0;

  for (const a of items) {
    totalAduan++;
    const name = keyOf(a);
    let row = map.get(name);
    if (!row) {
      const sc: Record<string, number> = {};
      for (const k of OPD_STATUS_KEYS) sc[k] = 0;
      row = {
        name,
        total: 0,
        statusCounts: sc,
        completionCount: 0,
        avgCompletionMinutes: null,
        avgCompletionTime: "--",
        responseCount: 0,
        avgResponseMinutes: null,
        avgResponseTime: "--",
      };
      map.set(name, row);
    }
    row.total++;

    const status = a.status ?? "Unknown";
    if (status in row.statusCounts) row.statusCounts[status]++;
    else row.statusCounts["Menunggu"]++;

    const pen = toMinutes(a.durasi_replies_first_last);
    if ((status === "Selesai" || status === "Closed") && pen !== null) {
      row.avgCompletionMinutes = (row.avgCompletionMinutes ?? 0) + pen;
      row.completionCount++;
      globalCompletionSum += pen;
      globalCompletionCount++;
    }

    const opd = toMinutes(a.durasi_opd_response);
    if (opd !== null) {
      row.avgResponseMinutes = (row.avgResponseMinutes ?? 0) + opd;
      row.responseCount++;
      globalResponseSum += opd;
      globalResponseCount++;
    }
  }

  let topName = "--";
  let topCount = 0;
  for (const row of map.values()) {
    if (row.completionCount > 0 && row.avgCompletionMinutes !== null) {
      row.avgCompletionMinutes = row.avgCompletionMinutes / row.completionCount;
      row.avgCompletionTime = formatMenit(row.avgCompletionMinutes);
    }
    if (row.responseCount > 0 && row.avgResponseMinutes !== null) {
      row.avgResponseMinutes = row.avgResponseMinutes / row.responseCount;
      row.avgResponseTime = formatMenit(row.avgResponseMinutes);
    }
    if (row.total > topCount) {
      topCount = row.total;
      topName = row.name;
    }
  }

  const rows = [...map.values()];
  const chartByCount = [...rows].sort((a, b) => b.total - a.total).slice(0, 15).map((r) => ({ label: r.name, value: r.total }));

  const withCompletion = rows.filter((r) => r.completionCount > 0 && r.avgCompletionMinutes !== null);
  const chartFastest = [...withCompletion]
    .sort((a, b) => (a.avgCompletionMinutes ?? 0) - (b.avgCompletionMinutes ?? 0))
    .slice(0, 15)
    .map((r) => ({ label: r.name, value: r.avgCompletionMinutes!, formatted: r.avgCompletionTime }));
  const chartSlowest = [...withCompletion]
    .sort((a, b) => (b.avgCompletionMinutes ?? 0) - (a.avgCompletionMinutes ?? 0))
    .slice(0, 15)
    .map((r) => ({ label: r.name, value: r.avgCompletionMinutes!, formatted: r.avgCompletionTime }));

  return {
    totalAduan,
    rows,
    globalAvgCompletionTime: globalCompletionCount > 0 ? formatMenit(globalCompletionSum / globalCompletionCount) : "--",
    globalCompletionCount,
    globalAvgResponseTime: globalResponseCount > 0 ? formatMenit(globalResponseSum / globalResponseCount) : "--",
    globalResponseCount,
    topName,
    topCount,
    chartByCount,
    chartFastest,
    chartSlowest,
  };
}

export function buildOpdData(items: Aduan[]): OpdData {
  const d = buildGroupedData(items, (a) => a.Layanan || "Unknown");
  return {
    ...d,
    rows: d.rows.map((r) => ({ ...r, layanan: r.name })),
    topOpd: d.topName,
  };
}

export function buildKategoriData(items: Aduan[]): GroupedData {
  return buildGroupedData(items, (a) => normalizeKategori(a.kategori));
}

/** Detail aduan untuk satu kategori (diurutkan waktu terbaru, dengan merge kategori). */
export function detailKategori(items: Aduan[], kategori: string): Aduan[] {
  return items
    .filter((a) => normalizeKategori(a.kategori) === kategori)
    .sort((a, b) => String(b.waktu_aduan ?? "").localeCompare(String(a.waktu_aduan ?? "")));
}

/** Detail aduan untuk satu layanan (diurutkan waktu terbaru). */
export function detailOpd(items: Aduan[], layanan: string): Aduan[] {
  return items
    .filter((a) => (a.Layanan ?? "") === layanan)
    .sort((a, b) => String(b.waktu_aduan ?? "").localeCompare(String(a.waktu_aduan ?? "")));
}

/* -------------------------------------------------------------------------- */
/*  Peta sebaran aduan (maps-aduan.php)                                       */
/* -------------------------------------------------------------------------- */

export interface AduanLocation {
  ticketid: string;
  latitude: number;
  longitude: number;
  alamat: string;
  kecamatan: string;
  kelurahan: string;
  kategori: string;
  status: string;
  nama_pelapor: string;
  waktu_aduan: string;
  no_hp: string;
  pesan_aduan: string;
  year: number;
}

/** Parse field `longlat` → koordinat; valid hanya jika dalam area Makassar. */
export function parseLonglat(longlat?: string | null): { lat: number; lng: number } | null {
  if (!longlat || longlat === "0") return null;
  const m = /Latitude:\s*(-?\d+\.?\d*),\s*Longitude:\s*(-?\d+\.?\d*)/.exec(longlat);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!(lat >= -6.0 && lat <= -4.5 && lng >= 119.0 && lng <= 120.0)) return null;
  return { lat, lng };
}

export interface MapFilter {
  year?: number;
  kategori?: string;
  status?: string;
}

/** Kumpulan lokasi aduan + pilihan filter (tahun/kategori/status) dari data. */
export function buildMapData(items: Aduan[], filter: MapFilter = {}) {
  const availableYears = new Set<number>();
  const availableKategori = new Set<string>();
  const availableStatus = new Set<string>();

  for (const a of items) {
    if (!parseLonglat(a.longlat)) continue;
    const y = Number((a.waktu_aduan ?? "").slice(0, 4));
    if (y) availableYears.add(y);
    const k = (a.kategori ?? "").trim();
    if (k) availableKategori.add(k);
    const s = (a.status ?? "").trim();
    if (s) availableStatus.add(s);
  }

  const years = [...availableYears].sort((a, b) => b - a);
  const kategori = [...availableKategori].sort();
  const status = [...availableStatus].sort();

  const selectedYear = filter.year ?? years[0] ?? new Date().getFullYear();

  const locations: AduanLocation[] = [];
  for (const a of items) {
    const coord = parseLonglat(a.longlat);
    if (!coord) continue;
    const y = Number((a.waktu_aduan ?? "").slice(0, 4));
    if (selectedYear > 0 && y !== selectedYear) continue;
    const k = (a.kategori ?? "").trim();
    if (filter.kategori && k !== filter.kategori) continue;
    const s = (a.status ?? "").trim();
    if (filter.status && s !== filter.status) continue;
    locations.push({
      ticketid: String(a.ticketid ?? ""),
      latitude: coord.lat,
      longitude: coord.lng,
      alamat: a.alamat ?? "",
      kecamatan: a.kecamatan ?? "",
      kelurahan: a.kelurahan ?? "",
      kategori: k,
      status: s,
      nama_pelapor: a.nama_pelapor ?? "",
      waktu_aduan: a.waktu_aduan ?? "",
      no_hp: a.no_hp ?? "",
      pesan_aduan: a.pesan_aduan ?? "",
      year: y,
    });
  }

  const statusCounts: Record<string, number> = {};
  for (const l of locations) statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;

  return { years, kategori, status, selectedYear, locations, statusCounts };
}

/** Kumpulan opsi filter (tahun/kategori/status) dari baris ber-longlat (untuk sidebar). */
export function buildMapFilterOptions(rows: { longlat?: string; waktu_aduan?: string; kategori?: string; status?: string }[]): {
  years: number[];
  kategori: string[];
  status: string[];
} {
  const y = new Set<number>();
  const k = new Set<string>();
  const s = new Set<string>();
  for (const r of rows) {
    if (!parseLonglat(r.longlat)) continue;
    const yr = Number((r.waktu_aduan ?? "").slice(0, 4));
    if (yr) y.add(yr);
    if (r.kategori?.trim()) k.add(r.kategori.trim());
    if (r.status?.trim()) s.add(r.status.trim());
  }
  return {
    years: [...y].sort((a, b) => b - a),
    kategori: [...k].sort(),
    status: [...s].sort(),
  };
}

/** Bangun lokasi peta dari baris query (sudah difilter di SQL).
 *  `pesan_aduan` dipotong agar payload ke client ringan (popup cukup menampilkan
 *  pratinjau). */
export function buildMapLocations(rows: { ticketid?: string | number; longlat?: string; alamat?: string; kecamatan?: string; kelurahan?: string; kategori?: string; status?: string; nama_pelapor?: string; waktu_aduan?: string; no_hp?: string; pesan_aduan?: string }[]): {
  locations: AduanLocation[];
  statusCounts: Record<string, number>;
} {
  const locations: AduanLocation[] = [];
  const statusCounts: Record<string, number> = {};
  for (const a of rows) {
    const coord = parseLonglat(a.longlat);
    if (!coord) continue;
    const y = Number((a.waktu_aduan ?? "").slice(0, 4));
    const st = (a.status ?? "").trim();
    const pesan = a.pesan_aduan ?? "";
    locations.push({
      ticketid: String(a.ticketid ?? ""),
      latitude: coord.lat,
      longitude: coord.lng,
      alamat: a.alamat ?? "",
      kecamatan: a.kecamatan ?? "",
      kelurahan: a.kelurahan ?? "",
      kategori: (a.kategori ?? "").trim(),
      status: st,
      nama_pelapor: a.nama_pelapor ?? "",
      waktu_aduan: a.waktu_aduan ?? "",
      no_hp: a.no_hp ?? "",
      pesan_aduan: pesan.length > 250 ? `${pesan.slice(0, 250)}…` : pesan,
      year: y,
    });
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  }
  return { locations, statusCounts };
}
