"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search, X } from "lucide-react";
import type { JalanSehat } from "@/lib/jalan-sehat";
import {
  bestEmail,
  bestName,
  bestNik,
  bestPhone,
  formatCreatedAt,
  normalizeParticipantType,
} from "@/lib/jalan-sehat";

declare global {
  interface Window {
    XLSX?: any;
  }
}

export function JalanSehatTable({
  rows,
  districtOptions,
  instansiOptions,
}: {
  rows: JalanSehat[];
  districtOptions: { label: string; count: number }[];
  instansiOptions: { label: string; count: number }[];
}) {
  const [kecamatan, setKecamatan] = useState("");
  const [tipe, setTipe] = useState("");
  const [instansi, setInstansi] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kecamatan && r.form_district_name !== kecamatan) return false;
      if (tipe && normalizeParticipantType(r.form_participant_type) !== tipe) return false;
      if (instansi && r.form_institution_name !== instansi) return false;
      if (ql) {
        const hay =
          `${r.ticket_number} ${bestName(r)} ${bestNik(r)} ${bestEmail(r)} ${bestPhone(r)} ${r.form_district_name} ${r.form_subdistrict_name} ${r.form_institution_name}`
            .toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [rows, kecamatan, tipe, instansi, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * PER_PAGE;
  const shown = filtered.slice(start, start + PER_PAGE);

  function reset() {
    setKecamatan("");
    setTipe("");
    setInstansi("");
    setQ("");
    setPage(1);
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
        ["No.", "Nomor Tiket", "Nama Lengkap", "NIK", "Email", "No. HP",
         "Kecamatan", "Kelurahan", "Tipe Peserta", "Instansi", "Tanggal Daftar"],
      ];
      filtered.forEach((r, i) => {
        data.push([
          i + 1,
          r.ticket_number || "-",
          bestName(r),
          bestNik(r),
          bestEmail(r),
          bestPhone(r),
          r.form_district_name || "-",
          r.form_subdistrict_name || "-",
          normalizeParticipantType(r.form_participant_type).toUpperCase(),
          r.form_institution_name || "-",
          formatCreatedAt(r.created_at),
        ]);
      });
      const ws = window.XLSX.utils.aoa_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data Jalan Sehat");
      const today = new Date();
      const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      window.XLSX.writeFile(wb, `Data_Jalan_Sehat_${ds}.xlsx`);
    } catch {
      alert("Gagal mengexport data. Pastikan browser mendukung download file.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={kecamatan}
            onChange={(e) => { setKecamatan(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua Kecamatan</option>
            {districtOptions.map((o) => (
              <option key={o.label} value={o.label}>
                {o.label} ({o.count.toLocaleString("id-ID")})
              </option>
            ))}
          </select>
          <select
            value={tipe}
            onChange={(e) => { setTipe(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua Tipe</option>
            <option value="asn">ASN</option>
            <option value="masyarakat">Masyarakat</option>
          </select>
          <select
            value={instansi}
            onChange={(e) => { setInstansi(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua Instansi</option>
            {instansiOptions.map((o) => (
              <option key={o.label} value={o.label}>
                {o.label} ({o.count.toLocaleString("id-ID")})
              </option>
            ))}
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
              placeholder="Cari nama/tiket/NIK…"
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
              <th className="px-5 py-3">No.</th>
              <th className="px-5 py-3">Nomor Tiket</th>
              <th className="px-5 py-3">Nama Lengkap</th>
              <th className="px-5 py-3">NIK</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">No. HP</th>
              <th className="px-5 py-3">Kecamatan</th>
              <th className="px-5 py-3">Kelurahan</th>
              <th className="px-5 py-3">Tipe Peserta</th>
              <th className="px-5 py-3">Instansi</th>
              <th className="px-5 py-3">Tanggal Daftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => {
              const tipeN = normalizeParticipantType(r.form_participant_type);
              return (
                <tr key={String(r.id)} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">{start + shown.indexOf(r) + 1}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.ticket_number ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{bestName(r)}</td>
                  <td className="px-5 py-3 text-slate-600">{bestNik(r)}</td>
                  <td className="px-5 py-3 text-slate-600">{bestEmail(r)}</td>
                  <td className="px-5 py-3 text-slate-600">{bestPhone(r)}</td>
                  <td className="px-5 py-3 text-slate-700">{r.form_district_name ?? "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{r.form_subdistrict_name ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                      tipeN === "asn"
                        ? "bg-blue-100 text-blue-700 ring-blue-200"
                        : "bg-green-100 text-green-700 ring-green-200"
                    }`}>
                      {tipeN === "asn" ? "ASN" : "MASYARAKAT"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r.form_institution_name ?? "-"}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{formatCreatedAt(r.created_at)}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={11} className="px-5 py-8 text-center text-slate-400">Tidak ada data yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{filtered.length === 0 ? 0 : start + 1}</strong>–
          <strong>{Math.min(start + PER_PAGE, filtered.length)}</strong> dari{" "}
          <strong>{filtered.length.toLocaleString("id-ID")}</strong> pendaftar
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
    </>
  );
}