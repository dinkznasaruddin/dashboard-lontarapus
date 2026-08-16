import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEmailLaporan, updateEmailLaporan, deleteEmailLaporan } from "@/lib/email-model";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/email/laporan/:id → perbarui nama/subjek/penerima/aktif. */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { id } = await ctx.params;
  const num = Number(id);
  if (!num) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const existing = await getEmailLaporan(num);
  if (!existing) return NextResponse.json({ error: "Format tidak ditemukan" }, { status: 404 });

  let body: { nama?: string; subjek?: string; penerima?: string; aktif?: number | boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  await updateEmailLaporan(num, {
    nama: body.nama ?? existing.nama,
    subjek: body.subjek ?? existing.subjek,
    penerima: body.penerima ?? existing.penerima,
    aktif: Number(body.aktif ?? existing.aktif),
  });

  const updated = await getEmailLaporan(num);
  return NextResponse.json({ ok: true, format: updated });
}

/** DELETE /api/email/laporan/:id → hapus format. */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { id } = await ctx.params;
  const num = Number(id);
  if (!num) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const existing = await getEmailLaporan(num);
  if (!existing) return NextResponse.json({ error: "Format tidak ditemukan" }, { status: 404 });

  await deleteEmailLaporan(num);
  return NextResponse.json({ ok: true });
}