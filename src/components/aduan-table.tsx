"use client";

import { useState, useMemo } from "react";
import { Eye, FileSpreadsheet, Search, X } from "lucide-react";
import type { Aduan } from "@/lib/aduan";
import { categorizeCompletionEn, categorizeDurationEn, normalizeKategori } from "@/lib/aduan";

declare global {
  interface Window {
    XLSX?: any;
  }
}

function fmt(d?: string | null): string {
  if (!d || d === "0000-00-00 00:00:00") return "-";
  const t = new Date(d);
  if (isNaN(+t)) return d;
  return t.toLocaleString("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function statusColor(status?: string): "green" | "yellow" | "blue" | "red" | "slate" {
  switch (status) {
    case "Selesai":
    case "Closed":
      return "green";
    case "Proses":
      return "yellow";
    case "Pending":
      return "blue";
    case "Ditolak":
      return "red";
    default:
      return "slate";
  }
}

function badgeColor(cat: string): string {
  switch (cat) {
    case "Very Fast":
      return "bg-green-100 text-green-700";
    case "Fast":
      return "bg-blue-100 text-blue-700";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "Slow":
      return "bg-red-100 text-red-700";
    case "Not Completed":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

interface DetailData {
  a: Aduan;
  waktu: string;
  firstReply: string;
  lastReply: string;
}

export function AduanTable({
  rows,
  layananOptions,
}: {
  rows: Aduan[];
  layananOptions: { label: string; count: number }[];
}) {
  const [layanan, setLayanan] = useState("");
  const [firstReply, setFirstReply] = useState("");
  const [completion, setCompletion] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (layanan && r.Layanan !== layanan) return false;
      if (firstReply && categorizeDurationEn(r.durasi_first_reply) !== firstReply) return false;
      if (completion && categorizeCompletionEn(r.durasi_replies_first_last, r.status) !== completion) return false;
      if (ql) {
        const hay = `${r.ticketid} ${r.nama_pelapor} ${r.kategori} ${r.kecamatan} ${r.pesan_aduan}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [rows, layanan, firstReply, completion, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * PER_PAGE;
  const shown = filtered.slice(start, start + PER_PAGE);

  function reset() {
    setLayanan("");
    setFirstReply("");
    setCompletion("");
    setQ("");
    setPage(1);
  }

  function openDetail(a: Aduan) {
    setDetail({
      a,
      waktu: fmt(a.waktu_aduan),
      firstReply: fmt(a.first_reply_date),
      lastReply: fmt(a.last_reply_date),
    });
  }

  async function exportExcel() {
    try {
      if (!window.XLSX) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Gagal memuat library export"));
          document.head.appendChild(s);
        });
      }
      const data: (string | number)[][] = [
        ["Ticket ID", "Layanan", "Status", "Kategori", "Kecamatan",
         "Durasi Respon Operator", "Durasi Respon OPD", "Durasi Total",
         "Kategori First Reply", "Status Penyelesaian", "Waktu Aduan",
         "Waktu Balasan Pertama", "Waktu Balasan Terakhir"],
      ];
      filtered.forEach((r) => {
        data.push([
          String(r.ticketid ?? ""),
          r.Layanan ?? "",
          r.status ?? "",
          normalizeKategori(r.kategori),
          r.kecamatan ?? "",
          r.durasi_first_reply ?? "",
          r.durasi_opd_response ?? "",
          r.durasi_replies_first_last ?? "",
          categorizeDurationEn(r.durasi_first_reply),
          categorizeCompletionEn(r.durasi_replies_first_last, r.status),
          r.waktu_aduan ?? "",
          r.first_reply_date ?? "",
          r.last_reply_date ?? "",
        ]);
      });
      const ws = window.XLSX.utils.aoa_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data Aduan");
      const today = new Date();
      const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      window.XLSX.writeFile(wb, `Data_Aduan_${ds}.xlsx`);
    } catch {
      alert("Gagal mengexport data. Pastikan browser mendukung download file.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={layanan}
            onChange={(e) => { setLayanan(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua Layanan</option>
            {layananOptions.map((o) => (
              <option key={o.label} value={o.label}>
                {o.label} ({o.count.toLocaleString("id-ID")})
              </option>
            ))}
          </select>
          <select
            value={firstReply}
            onChange={(e) => { setFirstReply(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Durasi First Reply: Semua</option>
            <option value="Very Fast">Very Fast (≤1 Jam)</option>
            <option value="Fast">Fast (1-6 Jam)</option>
            <option value="Medium">Medium (6-24 Jam)</option>
            <option value="Slow">Slow (&gt;24 Jam)</option>
            <option value="No Data">No Data</option>
          </select>
          <select
            value={completion}
            onChange={(e) => { setCompletion(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Status Penyelesaian: Semua</option>
            <option value="Very Fast">Selesai: Very Fast (≤8 Jam)</option>
            <option value="Fast">Selesai: Fast (8-24 Jam)</option>
            <option value="Medium">Selesai: Medium (1-3 Hari)</option>
            <option value="Slow">Selesai: Slow (&gt;3 Hari)</option>
            <option value="Not Completed">Belum Selesai</option>
            <option value="No Data">No Data</option>
          </select>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Clear Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Cari ticket/pelapor/kategori…"
              className="w-56 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Ticket ID</th>
              <th className="px-5 py-3">Layanan</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Kecamatan</th>
              <th className="px-5 py-3">Durasi Respon Awal Operator</th>
              <th className="px-5 py-3">Durasi Respon Awal OPD</th>
              <th className="px-5 py-3">Durasi Total</th>
              <th className="px-5 py-3">Kategori First Reply</th>
              <th className="px-5 py-3">Status Penyelesaian</th>
              <th className="px-5 py-3">Waktu Aduan</th>
              <th className="px-5 py-3">Waktu Balasan Pertama</th>
              <th className="px-5 py-3">Waktu Balasan Terakhir</th>
              <th className="px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={String(r.ticketid)} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.ticketid}</td>
                <td className="px-5 py-3 text-slate-700">{r.Layanan ?? "-"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                    statusColor(r.status) === "green" ? "bg-green-100 text-green-700 ring-green-200"
                    : statusColor(r.status) === "yellow" ? "bg-yellow-100 text-yellow-700 ring-yellow-200"
                    : statusColor(r.status) === "blue" ? "bg-blue-100 text-blue-700 ring-blue-200"
                    : statusColor(r.status) === "red" ? "bg-red-100 text-red-700 ring-red-200"
                    : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}>
                    {r.status ?? "-"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-700">{normalizeKategori(r.kategori)}</td>
                <td className="px-5 py-3 text-slate-700">{r.kecamatan ?? "-"}</td>
                <td className="px-5 py-3 text-center text-xs text-slate-500">{r.durasi_first_reply || "-"}</td>
                <td className="px-5 py-3 text-center text-xs text-slate-500">{r.durasi_opd_response || "-"}</td>
                <td className="px-5 py-3 text-center text-xs text-slate-500">{r.durasi_replies_first_last || "-"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor(categorizeDurationEn(r.durasi_first_reply))}`}>
                    {categorizeDurationEn(r.durasi_first_reply)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor(categorizeCompletionEn(r.durasi_replies_first_last, r.status))}`}>
                    {categorizeCompletionEn(r.durasi_replies_first_last, r.status)}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{fmt(r.waktu_aduan)}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{fmt(r.first_reply_date)}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{fmt(r.last_reply_date)}</td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openDetail(r)}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Eye className="h-3.5 w-3.5" /> Detail
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={15} className="px-5 py-8 text-center text-slate-400">Tidak ada data yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{filtered.length === 0 ? 0 : start + 1}</strong>–
          <strong>{Math.min(start + PER_PAGE, filtered.length)}</strong> dari{" "}
          <strong>{filtered.length.toLocaleString("id-ID")}</strong> aduan
        </p>
        <nav className="flex items-center gap-1">
          <button
            type="button"
            disabled={cur <= 1}
            onClick={() => setPage(cur - 1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:text-slate-300 enabled:text-slate-600 enabled:hover:bg-slate-100"
          >
            « Prev
          </button>
          <span className="px-3 py-1.5 text-sm font-semibold text-slate-700">
            {cur} / {totalPages}
          </span>
          <button
            type="button"
            disabled={cur >= totalPages}
            onClick={() => setPage(cur + 1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:text-slate-300 enabled:text-slate-600 enabled:hover:bg-slate-100"
          >
            Next »
          </button>
        </nav>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Detail Aduan #{detail.a.ticketid}</h3>
              <button type="button" onClick={() => setDetail(null)} className="text-white/80 transition hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-blue-600">Informasi Pelapor</h4>
                  <dl className="space-y-1.5 text-sm">
                    <Row k="Nama" v={detail.a.nama_pelapor || "-"} />
                    <Row k="No. HP" v={detail.a.no_hp || "-"} />
                    <Row k="Kecamatan" v={detail.a.kecamatan || "-"} />
                    <Row k="Kelurahan" v={detail.a.kelurahan || "-"} />
                    <Row k="Alamat" v={detail.a.alamat || "-"} />
                  </dl>
                </div>
                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-blue-600">Informasi Aduan</h4>
                  <dl className="space-y-1.5 text-sm">
                    <Row k="Status" v={detail.a.status || "-"} />
                    <Row k="Kategori" v={normalizeKategori(detail.a.kategori)} />
                    <Row k="Layanan" v={detail.a.Layanan || "-"} />
                    <Row k="Waktu Aduan" v={detail.waktu} />
                    <Row k="Tanggal" v={detail.a.tanggal || "-"} />
                  </dl>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-bold text-blue-600">Pesan Aduan</h4>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{detail.a.pesan_aduan || "-"}</p>
              </div>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-bold text-blue-600">Lokasi</h4>
                <p className="text-sm text-slate-500">{detail.a.longlat || "-"}</p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-green-600">Balasan Pertama</h4>
                  <dl className="space-y-1.5 text-sm">
                    <Row k="Waktu" v={detail.firstReply} />
                    <Row k="Durasi" v={detail.a.durasi_first_reply || "-"} />
                  </dl>
                  <p className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-slate-600">{detail.a.first_reply_message || "-"}</p>
                </div>
                <div>
                  <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-amber-600">Balasan Terakhir</h4>
                  <dl className="space-y-1.5 text-sm">
                    <Row k="Waktu" v={detail.lastReply} />
                    <Row k="Total Durasi" v={detail.a.durasi_replies_first_last || "-"} />
                  </dl>
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-600">{detail.a.last_reply_message || "-"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 font-semibold text-slate-600">{k}</dt>
      <dd className="text-slate-800">: {v}</dd>
    </div>
  );
}