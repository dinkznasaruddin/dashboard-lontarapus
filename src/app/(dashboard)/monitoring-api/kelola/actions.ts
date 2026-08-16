"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { execute } from "@/lib/db";

async function requireSuperadmin() {
  const session = await requireAuth();
  if (session.role !== "superadmin") {
    redirect("/monitoring-api");
  }
  return session;
}

export async function addApi(formData: FormData) {
  await requireSuperadmin();
  const apiName = String(formData.get("api_name") ?? "").trim();
  const endPoin = String(formData.get("end_poin") ?? "").trim();
  const methods = String(formData.get("methods") ?? "GET").trim();
  const status = String(formData.get("status") ?? "online").trim();
  const opd = String(formData.get("opd") ?? "").trim();

  if (!apiName || !endPoin) return;
  const safeStatus = status === "offline" ? "offline" : "online";

  await execute(
    "INSERT INTO tb_api (api_name, end_poin, methods, status, opd) VALUES (?, ?, ?, ?, ?)",
    [apiName, endPoin, methods, safeStatus, opd]
  );

  revalidatePath("/monitoring-api");
  revalidatePath("/monitoring-api/kelola");
  redirect("/monitoring-api/kelola");
}

export async function editApi(id: number, formData: FormData) {
  await requireSuperadmin();
  const apiName = String(formData.get("api_name") ?? "").trim();
  const endPoin = String(formData.get("end_poin") ?? "").trim();
  const methods = String(formData.get("methods") ?? "GET").trim();
  const status = String(formData.get("status") ?? "online").trim();
  const opd = String(formData.get("opd") ?? "").trim();

  if (!apiName || !endPoin || !id) return;
  const safeStatus = status === "offline" ? "offline" : "online";

  await execute(
    "UPDATE tb_api SET api_name = ?, end_poin = ?, methods = ?, status = ?, opd = ? WHERE id = ?",
    [apiName, endPoin, methods, safeStatus, opd, id]
  );

  revalidatePath("/monitoring-api");
  revalidatePath("/monitoring-api/kelola");
  redirect("/monitoring-api/kelola");
}

export async function deleteApi(id: number) {
  await requireSuperadmin();
  if (!id) return;
  await execute("DELETE FROM tb_api WHERE id = ?", [id]);

  revalidatePath("/monitoring-api");
  revalidatePath("/monitoring-api/kelola");
  redirect("/monitoring-api/kelola");
}