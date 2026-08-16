/**
 * Modul server-only untuk data cuaca BMKG.
 * Data diambil dari endpoint lama (superapps.makassarkota.go.id/cuaca/?ajax=1),
 * yang memproksi API BMKG. Hasil di-cache agar tidak memukul server setiap
 * request (data cuaca tidak berubah-ubah tiap detik).
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { fetchJsonSlow } from "@/lib/apis";

const CUACA_BASE = process.env.CUACA_API_URL || "https://superapps.makassarkota.go.id/cuaca/";

export interface CuacaItem {
  datetime?: string;
  local_datetime?: string;
  t?: number;
  tcc?: number;
  tp?: number;
  weather?: number;
  weather_desc?: string;
  weather_desc_en?: string;
  wd_deg?: number;
  wd?: string;
  wd_to?: string;
  ws?: number;
  hu?: number;
  vs?: number;
  vs_text?: string;
  time_index?: string;
  image?: string;
}

export interface CuacaData {
  lokasi: {
    adm1?: string;
    adm2?: string;
    adm3?: string;
    adm4?: string;
    provinsi?: string;
    kotkab?: string;
    kecamatan?: string;
    desa?: string;
    lon?: number;
    lat?: number;
    timezone?: string;
  };
  data: {
    lokasi?: CuacaData["lokasi"];
    cuaca: CuacaItem[][];
  }[];
}

export interface WarningData {
  headline?: string;
  area?: string;
  description?: string;
  instruction?: string;
  web?: string;
}

export interface EarthquakeData {
  Tanggal?: string;
  Jam?: string;
  DateTime?: string;
  Coordinates?: string;
  Lintang?: string;
  Bujur?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

export interface CuacaResponse {
  weather?: CuacaData | null;
  warning?: WarningData | null;
  earthquake?: EarthquakeData | null;
}

async function fetchCuacaRaw(adm4: string): Promise<CuacaResponse> {
  const url = `${CUACA_BASE}?ajax=1&adm4=${encodeURIComponent(adm4)}`;
  return fetchJsonSlow<CuacaResponse>(url, {
    timeoutMs: 30_000,
    connectTimeoutMs: 15_000,
  });
}

/** Ambil data cuaca (di-cache 600s). adm4 default Mariso. */
export const getCuaca = unstable_cache(
  async (adm4 = "73.71.01.1001"): Promise<CuacaResponse> => {
    try {
      return await fetchCuacaRaw(adm4);
    } catch (e) {
      console.error("[cuaca] fetch gagal:", (e as Error).message);
      return {};
    }
  },
  ["cuaca-bmkg"],
  { revalidate: 600 }
);