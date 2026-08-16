"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireSuperadmin() {
  const session = await requireAuth();
  if (session.role !== "superadmin") redirect("/dashboard");
  return session;
}

function collectMenu(formData: FormData): string {
  const keys = formData.getAll("menu_access[]").map(String);
  return JSON.stringify(keys);
}

function countMenu(formData: FormData): number {
  return formData.getAll("menu_access[]").length;
}

export async function addAkun(formData: FormData) {
  await requireSuperadmin();
  const nama = String(formData.get("nama") ?? "").trim();
  const skpd = String(formData.get("skpd") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConf = String(formData.get("password_confi") ?? "");
  const role = String(formData.get("role") ?? "SKPD").trim();
  const menuAccess = collectMenu(formData);
  const menuCount = countMenu(formData);

  if (!nama || !username) {
    redirect("/akun?action=add&jenis=error&pesan=Nama dan Username wajib diisi.");
  }
  if (!password) {
    redirect("/akun?action=add&jenis=error&pesan=Password wajib diisi untuk akun baru.");
  }
  if (password !== passwordConf) {
    redirect("/akun?action=add&jenis=error&pesan=Konfirmasi password tidak cocok.");
  }

  const hash = bcrypt.hashSync(password, 10);

  await execute(
    "INSERT INTO tb_user_admin (nama, skpd, username, password, role, menu_access) VALUES (?, ?, ?, ?, ?, ?)",
    [nama, skpd, username, hash, role, menuAccess]
  );

  revalidatePath("/akun");
  redirect(`/akun?jenis=success&pesan=Akun berhasil ditambahkan dengan ${menuCount} menu access.`);
}

export async function editAkun(id: number, formData: FormData) {
  await requireSuperadmin();
  const nama = String(formData.get("nama") ?? "").trim();
  const skpd = String(formData.get("skpd") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConf = String(formData.get("password_confi") ?? "");
  const role = String(formData.get("role") ?? "SKPD").trim();
  const menuAccess = collectMenu(formData);
  const menuCount = countMenu(formData);

  if (!nama || !username || !id) {
    redirect(`/akun?action=edit&id=${id}&jenis=error&pesan=Nama dan Username wajib diisi.`);
  }
  if (password && password !== passwordConf) {
    redirect(`/akun?action=edit&id=${id}&jenis=error&pesan=Konfirmasi password tidak cocok.`);
  }

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    await execute(
      "UPDATE tb_user_admin SET nama = ?, skpd = ?, username = ?, password = ?, role = ?, menu_access = ? WHERE id = ?",
      [nama, skpd, username, hash, role, menuAccess, id]
    );
  } else {
    await execute(
      "UPDATE tb_user_admin SET nama = ?, skpd = ?, username = ?, role = ?, menu_access = ? WHERE id = ?",
      [nama, skpd, username, role, menuAccess, id]
    );
  }

  revalidatePath("/akun");
  redirect(`/akun?jenis=success&pesan=Akun berhasil diperbarui dengan ${menuCount} menu access.`);
}

export async function deleteAkun(id: number, page = 1) {
  await requireSuperadmin();
  if (!id) return;
  await execute("DELETE FROM tb_user_admin WHERE id = ?", [id]);
  revalidatePath("/akun");
  redirect(`/akun?jenis=success&pesan=Akun berhasil dihapus.&page=${page}`);
}
