"use client";

import { FileSpreadsheet } from "lucide-react";

interface ExportRow {
  kelurahan: string;
  kecamatan: string;
  jumlah: number;
}

declare global {
  interface Window {
    XLSX?: any;
  }
}

/** Tombol export ke Excel (SheetJS via CDN, seperti sistem lama). */
export function ExcelExportButton({ rows }: { rows: ExportRow[] }) {
  async function handleExport() {
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
        ["No.", "Nama Kelurahan", "Nama Kecamatan", "Jumlah Register"],
      ];
      rows.forEach((r, i) => {
        data.push([i + 1, r.kelurahan, r.kecamatan, r.jumlah]);
      });

      const ws = window.XLSX.utils.aoa_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Data Registrasi");

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      window.XLSX.writeFile(wb, `Data_Registrasi_Kelurahan_${dateStr}.xlsx`);
    } catch (err) {
      alert("Gagal mengexport data. Pastikan browser mendukung download file.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      title="Export to Excel"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Export Excel
    </button>
  );
}