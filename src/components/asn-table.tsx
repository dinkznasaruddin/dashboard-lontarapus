"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FileSpreadsheet, Search, X } from "lucide-react";
import type { AsnTableRow } from "@/lib/asn-server";
import { formatTitleCase } from "@/lib/asn";

declare global {
  interface Window {
    XLSX?: any;
  }
}

function ProgressBar({ persen }: { persen: number }) {
  const color =
    persen >= 75 ? "bg-emerald-500" : persen >= 50 ? "bg-blue-500" : persen >= 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-slate-700">{persen.toFixed(2)}%</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, persen)}%` }} />
      </div>
    </div>
  );
}

export function AsnTable({
  rows,
  total,
  filtered,
  page,
  totalPages,
  satkerOptions,
}: {
  rows: AsnTableRow[];
  total: number;
  filtered: number;
  page: number;
  totalPages: number;
  satkerOptions: { label: string; count: number }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const filterStatus = sp.get("status") ?? "";
  const filterSatker = sp.get("satker") ?? "";
  const q = sp.get("q") ?? "";

  function update(params: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === "") next.delete(k);
      else next.set(k, v);
    }
    router.push(`/event/asn?${next.toString()}`);
  }

  function onStatusChange(v: string) {
    update({ status: v, page: "" });
  }
  function onSatkerChange(v: string) {
    update({ satker: v, page: "" });
  }
  function onSearch(v: string) {
    update({ q: v, page: "" });
  }
  function onPage(v: number) {
    update({ page: String(v) });
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
      // Export hanya data halaman saat ini (mirip PHP lama yang mengexport
      // data yang sedang difilter di server-side).
      const data: (string | number)[][] = [
        ["No", "Nama", "NIP", "Satuan Kerja", "Unit Kerja", "Status Pegawai", "NIK", "Status Jalan Sehat"],
      ];
      rows.forEach((r, i) => {
        data.push([
          page * 0 + i + 1,
          r.nama,
          r.nip,
          r.satuan_kerja,
          r.unit_kerja,
          r.status_pegawai,
          r.no_ktp,
          r.terdaftar ? "Sudah Daftar" : "Belum Daftar",
        ]);
      });
      const ws = window.XLSX.utils.aoa_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data ASN");
      const today = new Date();
      const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      window.XLSX.writeFile(wb, `Data_ASN_Jalan_Sehat_${ds}.xlsx`);
    } catch {
      alert("Gagal mengexport data. Pastikan browser mendukung download file.");
    }
  }

  const start = (page - 1) * 10;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2 px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status Jalan Sehat</label>
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              <option value="sudah">Sudah Daftar</option>
              <option value="belum">Belum Daftar</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Satuan Kerja</label>
            <select
              value={filterSatker}
              onChange={(e) => onSatkerChange(e.target.value)}
              className="max-w-[240px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {satkerOptions.map((o) => (
                <option key={o.label} value={o.label}>
                  {formatTitleCase(o.label)} ({o.count.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => update({ status: "", satker: "", q: "", page: "" })}
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
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Cari nama/NIP/NIK/status…"
              className="w-64 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">No</th>
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">NIP</th>
              <th className="px-5 py-3">Satuan Kerja</th>
              <th className="px-5 py-3">Unit Kerja</th>
              <th className="px-5 py-3">Status Pegawai</th>
              <th className="px-5 py-3">NIK</th>
              <th className="px-5 py-3">Status Jalan Sehat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.no} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-500">{start + rows.indexOf(r) + 1}</td>
                <td className="px-5 py-3 text-slate-700">{r.nama}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.nipCensored}</td>
                <td className="px-5 py-3 text-slate-700">{r.satuan_kerja}</td>
                <td className="px-5 py-3 text-slate-600">{r.unit_kerja}</td>
                <td className="px-5 py-3 text-slate-600">{r.status_pegawai}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.no_ktpCensored}</td>
                <td className="px-5 py-3">
                  {r.terdaftar ? (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                      Sudah Daftar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      Belum Daftar
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">Tidak ada data yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{filtered === 0 ? 0 : start + 1}</strong>–
          <strong>{Math.min(start + 10, filtered)}</strong> dari{" "}
          <strong>{filtered.toLocaleString("id-ID")}</strong> pegawai
          {filtered !== total && (
            <span className="text-slate-400"> (total {total.toLocaleString("id-ID")})</span>
          )}
        </p>
        <nav className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:text-slate-300 enabled:text-slate-600 enabled:hover:bg-slate-100"
          >
            « Prev
          </button>
          <span className="px-3 py-1.5 text-sm font-semibold text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:text-slate-300 enabled:text-slate-600 enabled:hover:bg-slate-100"
          >
            Next »
          </button>
        </nav>
      </div>
    </>
  );
}