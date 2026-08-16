import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendEmailReport } from "@/lib/email-report";
import {
  listEmailLaporan,
  getEmailLaporan,
  parseRecipients,
  fillSubjectTemplate,
} from "@/lib/email-model";
import { runFormatGenerator } from "@/lib/email-report";

export const dynamic = "force-dynamic";

/** GET /api/email/laporan → daftar format email (model). */
export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const formats = await listEmailLaporan();
  return NextResponse.json({ formats });
}

/** POST /api/email/laporan → kirim email untuk format (id di body). */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Format id wajib diisi" }, { status: 400 });

  const format = await getEmailLaporan(id);
  if (!format) return NextResponse.json({ error: "Format tidak ditemukan" }, { status: 404 });
  if (!format.aktif) {
    return NextResponse.json({ error: "Format email nonaktif" }, { status: 400 });
  }

  try {
    const result = await runFormatGenerator(format.kode);
    const subject = fillSubjectTemplate(format.subjek);
    const recipients = parseRecipients(format.penerima);

    const smtp = await sendEmailReport(recipients, subject, result.html);

    return NextResponse.json({
      ok: smtp.ok,
      format: format.nama,
      kode: format.kode,
      subject,
      sentTo: smtp.sentTo ?? [],
      error: smtp.error ?? null,
      log: smtp.log,
      summary: result.summary ?? null,
      recipients,
      html: smtp.ok ? result.html : null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}