"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmailFormatCard } from "@/components/email-format-card";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Loader2, Mail, Server, Info, Plus } from "lucide-react";

interface FormatItem {
  id: number;
  nama: string;
  kode: string;
  subjek: string;
  penerima: string;
  aktif: number;
}

interface ListResponse {
  formats: FormatItem[];
}

export default function LaporanEmailPage() {
  const router = useRouter();
  const [formats, setFormats] = useState<FormatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newFormat, setNewFormat] = useState({
    nama: "",
    kode: "",
    subjek: "",
    penerima: "",
  });
  const [creating, setCreating] = useState(false);

  async function loadFormats() {
    setLoading(true);
    try {
      const res = await fetch("/api/email/laporan", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ListResponse;
      setFormats(data.formats);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormats();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/email/laporan/tambah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFormat),
      });
      const data = await res.json();
      if (data.ok) {
        setShowCreate(false);
        setNewFormat({ nama: "", kode: "", subjek: "", penerima: "" });
        await loadFormats();
      } else {
        setError(data.error || "Gagal membuat format");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kirim Laporan Email Otomatis"
        subtitle="Format laporan email & penerima dapat dikustomisasi"
        action={
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-[#B21D28] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#9c1923]"
          >
            <Plus className="h-4 w-4" />
            Tambah Format
          </button>
        }
      />

      {showCreate && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Tambah Format Email Baru</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nama Format</label>
              <input
                type="text"
                value={newFormat.nama}
                onChange={(e) => setNewFormat({ ...newFormat, nama: e.target.value })}
                placeholder="Contoh: Laporan Aduan Bulanan"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Kode Generator</label>
              <input
                type="text"
                value={newFormat.kode}
                onChange={(e) => setNewFormat({ ...newFormat, kode: e.target.value })}
                placeholder="contoh: aduan_harian"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Subjek (gunakan {"{tanggal}"} untuk tanggal)
              </label>
              <input
                type="text"
                value={newFormat.subjek}
                onChange={(e) => setNewFormat({ ...newFormat, subjek: e.target.value })}
                placeholder="Contoh: Laporan Aduan Harian - {tanggal}"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Penerima (satu email per baris atau dipisah koma)
              </label>
              <textarea
                value={newFormat.penerima}
                onChange={(e) => setNewFormat({ ...newFormat, penerima: e.target.value })}
                rows={3}
                placeholder="email1@domain.com&#10;email2@domain.com"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#B21D28]"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newFormat.nama || !newFormat.kode}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat format email...
        </div>
      ) : error && formats.length === 0 ? (
        <p className="py-10 text-center text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {formats.map((f) => (
            <EmailFormatCard key={f.id} format={f} />
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Konfigurasi SMTP" />
          <CardBody>
            <div className="flex items-start gap-3 text-sm">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-slate-500">SMTP Server</p>
                <p className="font-medium text-slate-800">10.1.6.173 (mail.makassarkota.go.id)</p>
                <p className="mt-1 text-xs text-slate-400">
                  Port auto-detect (25/587/465) · Pengirim: report@aduan.makassarkota.go.id
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Informasi" />
          <CardBody>
            <div className="flex items-start gap-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B21D28]" />
              <p className="text-slate-600">
                Preview email hanya muncul setelah tombol Kirim ditekan. Format email tersimpan
                di tabel <code>tb_email_laporan</code> sehingga mudah ditambah/diubah.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}