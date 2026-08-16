"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { requireAuth, hasMenuAccess } from "@/lib/auth";
import { execute, query } from "@/lib/db";

const EVENT_UPLOAD_DIR = "dashboard/event";
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

async function requireEventAccess() {
  const session = await requireAuth();
  if (!hasMenuAccess(session, "event")) redirect("/");
  return session;
}

/** Konversi tanggal input (yyyy-mm-dd) ke format database (dd-mm-yyyy). */
function toDbDate(dateInput: string): string {
  const parts = dateInput.split("-");
  if (parts.length !== 3) return dateInput;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function handleUpload(
  formData: FormData
): Promise<{ url: string; error: string | null }> {
  const file = formData.get("gambar");
  if (!(file instanceof File) || file.size === 0) {
    return { url: String(formData.get("gambar_lama") ?? ""), error: null };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: "", error: "Tipe file tidak diizinkan. Hanya JPG dan PNG." };
  }
  if (file.size > MAX_SIZE) {
    return { url: "", error: "Ukuran file melebihi 2MB." };
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `event_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}.${ext}`;
  const dir = path.join(process.cwd(), "public", EVENT_UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/${EVENT_UPLOAD_DIR}/${filename}`, error: null };
}

async function removeUploaded(gambar: string) {
  if (!gambar.startsWith(`/${EVENT_UPLOAD_DIR}/`)) return;
  try {
    await unlink(path.join(process.cwd(), "public", gambar.replace(/^\//, "")));
  } catch {}
}

function readFields(formData: FormData) {
  return {
    judul: String(formData.get("judul") ?? "").trim(),
    deskripsi: String(formData.get("deskripsi") ?? "").trim(),
    tgl_event: toDbDate(String(formData.get("tgl_event") ?? "").trim()),
    tempat: String(formData.get("tempat") ?? "").trim(),
    organizer: String(formData.get("organizer") ?? "").trim(),
    latitude: String(formData.get("latitude") ?? "").trim(),
    longitude: String(formData.get("longitude") ?? "").trim(),
    status: Number(formData.get("status") ?? 1) || 1,
  };
}

export async function addEvent(formData: FormData) {
  await requireEventAccess();
  const f = readFields(formData);

  if (!f.judul || !f.tempat) {
    redirect("/master-data/event?action=add&jenis=error&pesan=Judul dan tempat wajib diisi.");
  }

  const { url, error } = await handleUpload(formData);
  if (error) {
    redirect(`/master-data/event?action=add&jenis=error&pesan=${encodeURIComponent(error)}`);
  }
  if (!url) {
    redirect("/master-data/event?action=add&jenis=error&pesan=Gambar wajib diisi.");
  }

  await execute(
    "INSERT INTO tb_event (judul, deskripsi, gambar, tgl_event, tempat, organizer, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [f.judul, f.deskripsi, url, f.tgl_event, f.tempat, f.organizer, f.latitude, f.longitude, f.status]
  );

  revalidatePath("/master-data/event");
  revalidateTag("lontara-summary");
  redirect("/master-data/event?jenis=success&pesan=Event berhasil ditambahkan.");
}

export async function editEvent(id: number, formData: FormData) {
  await requireEventAccess();
  if (!id) return;
  const f = readFields(formData);

  if (!f.judul || !f.tempat) {
    redirect(`/master-data/event?action=edit&id=${id}&jenis=error&pesan=Judul dan tempat wajib diisi.`);
  }

  const { url, error } = await handleUpload(formData);
  if (error) {
    redirect(`/master-data/event?action=edit&id=${id}&jenis=error&pesan=${encodeURIComponent(error)}`);
  }

  const old = String(formData.get("gambar_lama") ?? "");
  if (url && url !== old) await removeUploaded(old);

  await execute(
    "UPDATE tb_event SET judul=?, deskripsi=?, gambar=?, tgl_event=?, tempat=?, organizer=?, latitude=?, longitude=?, status=? WHERE id=?",
    [f.judul, f.deskripsi, url, f.tgl_event, f.tempat, f.organizer, f.latitude, f.longitude, f.status, id]
  );

  revalidatePath("/master-data/event");
  revalidateTag("lontara-summary");
  redirect("/master-data/event?jenis=success&pesan=Event berhasil diperbarui.");
}

export async function deleteEvent(id: number, page = 1) {
  await requireEventAccess();
  if (!id) return;
  const rows = await query<{ gambar: string }>("SELECT gambar FROM tb_event WHERE id = ?", [id]);
  await execute("DELETE FROM tb_event WHERE id = ?", [id]);
  if (rows[0]) await removeUploaded(rows[0].gambar);

  revalidatePath("/master-data/event");
  revalidateTag("lontara-summary");
  redirect(`/master-data/event?jenis=success&pesan=Event berhasil dihapus.&page=${page}`);
}
