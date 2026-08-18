import { unstable_cache } from "next/cache";

/**
 * Klien untuk API Makassar Move (AWS Lambda Function URL).
 * Dipakai oleh halaman Event Management (produksi) dan Event Staging.
 * Tiap mode memakai endpoint API yang berbeda.
 */

const API_BASE_PRODUCTION =
  process.env.MAKASSAR_MOVE_API_URL ||
  "https://xtl4j4rwxc23en43ripffnul7a0ktikl.lambda-url.ap-southeast-3.on.aws";

const API_BASE_STAGING =
  process.env.MAKASSAR_MOVE_STAGING_API_URL ||
  "https://4agoksncbupcqp3brjv4i7glwi0kagvw.lambda-url.ap-southeast-3.on.aws";

export interface MmEvent {
  eventId: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string[];
  max_participants: number;
  current_participants: number;
  status: string;
  aduan_status: string[];
  aduan_score: number;
  distance_score: number;
  image_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface MmEventPayload {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string[];
  max_participants: number;
  status: string;
  aduan_status: string[];
  aduan_score: number;
  distance_score: number;
  image_url?: string;
  location?: string;
}

export interface ApiResponse {
  status: number;
  body: any;
}

export interface MmLeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  club_name: string | null;
  avatar_url: string | null;
  number_participant: string;
  total_distance_km: number;
  distance_points: number;
  aduan_count: number;
  aduan_points: number;
  total_points: number;
  is_current_user: boolean;
}

export interface MmLeaderboard {
  aduan_score: number;
  distance_score: number;
  leaderboard: MmLeaderboardEntry[];
}

/** Config per mode halaman (produksi vs staging). */
export const MAKASSAR_MOVE_MODES = {
  production: {
    key: "production",
    basePath: "/makassar-move/event-management",
    accessKeys: ["makassar_move", "event", "event_management"],
    title: "Makassar Move - Manajemen Event",
    subtitle: "Daftar semua event yang tersimpan di API.",
  },
  staging: {
    key: "staging",
    basePath: "/makassar-move/staging",
    accessKeys: ["makassar_move", "event_management_staging"],
    title: "Makassar Move - Event Staging",
    subtitle: "Versi staging manajemen event Makassar Move.",
  },
} as const;

export type MakassarMoveMode = keyof typeof MAKASSAR_MOVE_MODES;

/** Ambil base URL API sesuai mode (produksi vs staging). */
export function getApiBase(mode: MakassarMoveMode): string {
  return mode === "staging" ? API_BASE_STAGING : API_BASE_PRODUCTION;
}

async function callApi(mode: MakassarMoveMode, method: string, endpoint: string, data?: unknown): Promise<ApiResponse> {
  const res = await fetch(`${getApiBase(mode)}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, body };
}

export async function getEvents(mode: MakassarMoveMode): Promise<MmEvent[]> {
  const { status, body } = await callApi(mode, "GET", "/events");
  if (status !== 200 || !Array.isArray(body)) return [];
  return body as MmEvent[];
}

export async function getEvent(mode: MakassarMoveMode, id: string): Promise<MmEvent | null> {
  const { status, body } = await callApi(mode, "GET", `/events/${encodeURIComponent(id)}`);
  if (status !== 200 || !body || !body.eventId) return null;
  return body as MmEvent;
}

export async function createEventApi(mode: MakassarMoveMode, payload: MmEventPayload): Promise<ApiResponse> {
  return callApi(mode, "POST", "/events", payload);
}

export async function updateEventApi(mode: MakassarMoveMode, id: string, payload: MmEventPayload): Promise<ApiResponse> {
  return callApi(mode, "PUT", `/events/${encodeURIComponent(id)}`, payload);
}

export async function deleteEventApi(mode: MakassarMoveMode, id: string): Promise<ApiResponse> {
  return callApi(mode, "DELETE", `/events/${encodeURIComponent(id)}`);
}

export async function getLeaderboard(mode: MakassarMoveMode, eventId: string): Promise<MmLeaderboard | null> {
  const { status, body } = await callApi(mode, "GET", `/events/${encodeURIComponent(eventId)}/leaderboard`);
  if (status !== 200 || !body || !Array.isArray(body.leaderboard)) return null;
  return body as MmLeaderboard;
}

export const getEventsCached = unstable_cache(
  async (mode: MakassarMoveMode) => getEvents(mode),
  ["makassar-move-events"],
  { revalidate: 300, tags: ["makassar-move"] }
);

/** Label + warna badge untuk status event. */
export const EVENT_STATUS_META: Record<
  string,
  { label: string; color: "blue" | "green" | "slate" | "gray" }
> = {
  akan_datang: { label: "Akan Datang", color: "blue" },
  berlangsung: { label: "Berlangsung", color: "green" },
  selesai: { label: "Selesai", color: "slate" },
};

/** Label + warna badge untuk filter status aduan. */
export const ADUAN_STATUS_META: Record<
  string,
  { label: string; color: "green" | "red" | "yellow" | "blue" | "slate" | "gray" }
> = {
  open: { label: "Open", color: "green" },
  "in progress": { label: "In Progress", color: "yellow" },
  answered: { label: "Answered", color: "blue" },
  "on hold": { label: "On Hold", color: "slate" },
  closed: { label: "Closed", color: "red" },
  berlangsung: { label: "Berlangsung", color: "green" },
  akan_datang: { label: "Akan Datang", color: "blue" },
  selesai: { label: "Selesai", color: "slate" },
};