"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, hasMenuAccess } from "@/lib/auth";
import {
  MAKASSAR_MOVE_MODES,
  type MakassarMoveMode,
  type MmEventPayload,
  createEventApi,
  updateEventApi,
  deleteEventApi,
} from "@/lib/makassar-move";

/** Validasi akses sesuai mode (produksi vs staging). */
async function requireModeAccess(mode: MakassarMoveMode) {
  const session = await requireAuth();
  const keys = MAKASSAR_MOVE_MODES[mode].accessKeys;
  if (session.role !== "superadmin" && !keys.some((k) => hasMenuAccess(session, k))) {
    redirect("/dashboard");
  }
}

/** datetime-local ("YYYY-MM-DDTHH:mm") → "YYYY-MM-DDTHH:mm:00.000Z". */
function toApiDate(value: string): string {
  if (!value) return "";
  const v = value.length === 16 ? `${value}:00` : value;
  return `${v}.000Z`;
}

function buildPayload(formData: FormData): MmEventPayload {
  const category = formData.getAll("category").map(String);
  const aduanStatus = formData.getAll("aduan_status").map(String);
  const payload: MmEventPayload = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    start_date: toApiDate(String(formData.get("start_date") ?? "").trim()),
    end_date: toApiDate(String(formData.get("end_date") ?? "").trim()),
    category: category.length > 0 ? category : ["Lari"],
    max_participants: Number(formData.get("max_participants")) || 1000,
    status: String(formData.get("status") ?? "akan_datang"),
    aduan_status: aduanStatus.length > 0 ? aduanStatus : ["open"],
    aduan_score: Number(formData.get("aduan_score")) || 0,
    distance_score: Number(formData.get("distance_score")) || 0,
  };
  // Field opsional: hanya dikirim bila tidak kosong (update parsial, API
  // menolak null untuk image_url & location).
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  if (imageUrl) payload.image_url = imageUrl;
  if (location) payload.location = location;
  return payload;
}

export async function createEvent(mode: MakassarMoveMode, formData: FormData) {
  await requireModeAccess(mode);
  const base = MAKASSAR_MOVE_MODES[mode].basePath;
  const payload = buildPayload(formData);

  if (!payload.title || !payload.description || !payload.start_date || !payload.end_date) {
    redirect(`${base}?action=add&jenis=error&pesan=Judul, deskripsi, dan tanggal wajib diisi.`);
  }

  const res = await createEventApi(mode, payload);
  if (res.status !== 201) {
    const msg = res.body?.message ?? `Error API (${res.status})`;
    redirect(`${base}?action=add&jenis=error&pesan=${encodeURIComponent(`Gagal membuat event. ${msg}`)}`);
  }

  // Endpoint POST /events tidak menyimpan field 'status' — set via PUT.
  const createdId = res.body?.event?.eventId ?? null;
  if (createdId) {
    await updateEventApi(mode, String(createdId), { status: payload.status } as MmEventPayload);
  }

  revalidatePath(base);
  revalidateTag("makassar-move");
  redirect(`${base}?jenis=success&pesan=Event berhasil ditambahkan.`);
}

export async function updateEvent(mode: MakassarMoveMode, id: string, formData: FormData) {
  await requireModeAccess(mode);
  const base = MAKASSAR_MOVE_MODES[mode].basePath;
  const payload = buildPayload(formData);

  if (!payload.title || !payload.description || !payload.start_date || !payload.end_date) {
    redirect(`${base}?action=edit&id=${encodeURIComponent(id)}&jenis=error&pesan=Judul, deskripsi, dan tanggal wajib diisi.`);
  }

  const res = await updateEventApi(mode, id, payload);
  if (res.status !== 200) {
    const msg = res.body?.message ?? `Error API (${res.status})`;
    redirect(`${base}?action=edit&id=${encodeURIComponent(id)}&jenis=error&pesan=${encodeURIComponent(`Gagal memperbarui. ${msg}`)}`);
  }

  revalidatePath(base);
  revalidateTag("makassar-move");
  redirect(`${base}?jenis=success&pesan=Event berhasil diperbarui.`);
}

export async function deleteEvent(mode: MakassarMoveMode, id: string, page = 1) {
  await requireModeAccess(mode);
  const base = MAKASSAR_MOVE_MODES[mode].basePath;

  const res = await deleteEventApi(mode, id);
  if (res.status === 409) {
    const msg = res.body?.message ?? "Event memiliki peserta, arsipkan sebagai gantinya.";
    redirect(`${base}?jenis=error&pesan=${encodeURIComponent(`Gagal menghapus: ${msg}`)}&page=${page}`);
  }
  if (res.status !== 200) {
    const msg = res.body?.message ?? `Error API (${res.status})`;
    redirect(`${base}?jenis=error&pesan=${encodeURIComponent(`Gagal menghapus: ${msg}`)}&page=${page}`);
  }

  revalidatePath(base);
  revalidateTag("makassar-move");
  redirect(`${base}?jenis=success&pesan=Event berhasil dihapus.&page=${page}`);
}