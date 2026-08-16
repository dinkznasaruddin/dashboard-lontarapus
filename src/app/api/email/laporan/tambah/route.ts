import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createEmailLaporan } from "@/lib/email-model";
import { isKnownFormat } from "@/lib/email-report";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: { nama?: string; kode?: string; subjek?: string; penerima?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const nama = String(body.nama ?? "").trim();
  const kode = String(body.kode ?? "").trim();
  const subjek = String(body.subjek ?? "").trim();
  const penerima = String(body.penerima ?? "").trim();

  if (!nama || !kode || !subjek || !penerima) {
    return NextResponse.json({ error: "Nama, kode, subjek, dan penerima wajib diisi" }, { status: 400 });
  }

  if (!isKnownFormat(kode)) {
    return NextResponse.json(
      { error: `Kode generator "${kode}" tidak dikenal. Gunakan: aduan_harian` },
      { status: 400 }
    );
  }

  try {
    const id = await createEmailLaporan({ nama, kode, subjek, penerima, aktif: 1 });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}