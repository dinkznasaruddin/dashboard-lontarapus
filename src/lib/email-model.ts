/**
 * Server-only: model format laporan email di tabel tb_email_laporan.
 * Format disimpan di DB agar mudah bertambah (tidak hardcode di kode).
 * Generator HTML dikaitkan lewat kolom `kode` (registry di email-report.ts).
 */

import "server-only";
import { query, queryOne, execute } from "@/lib/db";

export interface EmailLaporan {
  id: number;
  nama: string;
  kode: string;
  subjek: string;
  penerima: string;
  aktif: number;
  created_at?: string;
  updated_at?: string;
}

/** Daftar format email aktif. */
export async function listEmailLaporan(): Promise<EmailLaporan[]> {
  return query<EmailLaporan>(
    "SELECT * FROM tb_email_laporan ORDER BY aktif DESC, id ASC"
  );
}

/** Ambil satu format. */
export async function getEmailLaporan(id: number): Promise<EmailLaporan | null> {
  return queryOne<EmailLaporan>("SELECT * FROM tb_email_laporan WHERE id = ?", [id]);
}

/** Perbarui nama, subjek, penerima, dan status aktif. */
export async function updateEmailLaporan(
  id: number,
  data: { nama: string; subjek: string; penerima: string; aktif: number }
): Promise<void> {
  await execute(
    "UPDATE tb_email_laporan SET nama = ?, subjek = ?, penerima = ?, aktif = ? WHERE id = ?",
    [data.nama.trim(), data.subjek.trim(), data.penerima.trim(), data.aktif ? 1 : 0, id]
  );
}

/** Buat format baru. */
export async function createEmailLaporan(data: {
  nama: string;
  kode: string;
  subjek: string;
  penerima: string;
  aktif: number;
}): Promise<number> {
  const res = await execute(
    "INSERT INTO tb_email_laporan (nama, kode, subjek, penerima, aktif) VALUES (?, ?, ?, ?, ?)",
    [data.nama.trim(), data.kode.trim(), data.subjek.trim(), data.penerima.trim(), data.aktif ? 1 : 0]
  );
  return res;
}

/** Hapus format. */
export async function deleteEmailLaporan(id: number): Promise<void> {
  await execute("DELETE FROM tb_email_laporan WHERE id = ?", [id]);
}

/** Pisahkan daftar penerima (baris/baris atau koma). */
export function parseRecipients(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ganti placeholder {tanggal} pada subjek. */
export function fillSubjectTemplate(template: string): string {
  const tgl = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return template.replace(/\{tanggal\}/g, tgl);
}