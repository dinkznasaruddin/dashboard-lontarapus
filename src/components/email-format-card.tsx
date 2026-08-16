"use client";

import { useState } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Save,
  Trash2,
  Eye,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FormatItem {
  id: number;
  nama: string;
  kode: string;
  subjek: string;
  penerima: string;
  aktif: number;
}

interface SendResult {
  ok: boolean;
  subject?: string;
  sentTo?: string[];
  error?: string | null;
  log?: string[];
  summary?: { totalLayanan: number; totalAduan: number; totalSelesai: number } | null;
  recipients?: string[];
  html?: string | null;
}

export function EmailFormatCard({ format }: { format: FormatItem }) {
  const [editing, setEditing] = useState(false);
  const [nama, setNama] = useState(format.nama);
  const [subjek, setSubjek] = useState(format.subjek);
  const [penerima, setPenerima] = useState(format.penerima);
  const [aktif, setAktif] = useState(format.aktif === 1);
  const [saving, setSaving] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const recipientsCount = penerima
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/email/laporan/${format.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, subjek, penerima, aktif }),
      });
      const data = await res.json();
      if (data.ok) {
        setEditing(false);
        setResult({ ok: true, sentTo: [], error: null, subject: "Pengaturan tersimpan" });
      } else {
        setResult({ ok: false, error: data.error || "Gagal menyimpan" });
      }
    } catch {
      setResult({ ok: false, error: "Terjadi kesalahan koneksi" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setResult(null);
    setShowPreview(false);
    try {
      const res = await fetch("/api/email/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: format.id }),
      });
      const data = (await res.json()) as SendResult;
      setResult(data);
      if (data.html) setShowPreview(true);
    } catch {
      setResult({ ok: false, error: "Terjadi kesalahan koneksi" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${aktif ? "bg-green-500" : "bg-slate-300"}`}
          />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{nama}</h3>
            <p className="text-xs text-slate-400">
              kode: <code>{format.kode}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {editing ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editing ? "Tutup" : "Edit"}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Ringkasan */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-500">
            Subjek: <span className="font-medium text-slate-700">{subjek}</span>
          </p>
          <p className="text-xs text-slate-400">
            {recipientsCount} penerima
          </p>
        </div>

        {editing && (
          <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nama Format</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Subjek (gunakan {"{tanggal}"} untuk tanggal)
              </label>
              <input
                type="text"
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Penerima (satu email per baris atau dipisah koma)
              </label>
              <textarea
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={aktif}
                onChange={(e) => setAktif(e.target.checked)}
                className="h-4 w-4"
              />
              Aktif
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex h-9 items-center justify-center gap-2 rounded-md bg-slate-800 px-4 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Simpan
            </button>
          </div>
        )}

        {/* Hasil kirim */}
        {result?.ok ? (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <div>
              <strong>{result.subject || "Berhasil"}</strong>
              {result.sentTo && result.sentTo.length > 0 && (
                <p className="mt-0.5 text-xs">
                  Terkirim ke {result.sentTo.length} penerima: {result.sentTo.join(", ")}
                </p>
              )}
              {result.summary && (
                <p className="mt-0.5 text-xs">
                  {result.summary.totalAduan} aduan, {result.summary.totalSelesai} selesai
                </p>
              )}
            </div>
          </div>
        ) : result?.ok === false ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <div>
              <strong>Gagal mengirim.</strong>
              <p className="mt-0.5 text-xs">{result.error || "Periksa konfigurasi SMTP."}</p>
            </div>
          </div>
        ) : null}

        {/* Tombol aksi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !aktif}
            className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#B21D28] text-sm font-semibold text-white shadow-md transition hover:bg-[#9c1923] disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengambil data & mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim Email Sekarang
              </>
            )}
          </button>

          {result?.html && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Tutup" : "Preview"}
            </button>
          )}

          {result?.log && result.log.length > 0 && !result.ok && (
            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="flex h-[42px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ChevronDown className="h-4 w-4" />
              Log
            </button>
          )}
        </div>

        {/* Preview setelah kirim */}
        {showPreview && result?.html && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <iframe
              title="Preview Email"
              srcDoc={result.html}
              className="h-[520px] w-full bg-slate-50"
              sandbox=""
            />
          </div>
        )}

        {/* Log error */}
        {showLog && result?.log && (
          <div className="rounded-lg border border-red-100 bg-red-50/60 p-3">
            <p className="mb-1.5 text-xs font-semibold text-red-700">Log SMTP:</p>
            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-red-800">
              {result.log.join("\n")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}