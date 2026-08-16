"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface DetailRow {
  ticketid?: string | number;
  kategori?: string;
  status?: string;
  kelurahan?: string;
  Layanan?: string;
  nama_pelapor?: string;
  durasi_replies_first_last?: string;
  waktu_aduan?: string;
}

const STATUS_BADGE: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Proses: "bg-amber-100 text-amber-700",
  Pending: "bg-sky-100 text-sky-700",
  Menunggu: "bg-slate-100 text-slate-600",
  Ditolak: "bg-red-100 text-red-700",
};

function formatMenit(v: string | undefined): string {
  if (!v) return "-";
  const m = /^(\d+):(\d+)$/.exec(v.trim());
  if (!m) return v;
  const mins = Number(m[1]) * 60 + Number(m[2]);
  if (mins < 60) return `${mins} mnt`;
  return `${(mins / 60).toFixed(1)} jam`;
}

function fmtTanggal(v?: string): string {
  if (!v) return "-";
  try {
    return new Date(v.replace(" ", "T")).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
}

export function AduanDetailButton({
  type,
  name,
  label,
}: {
  type: "kategori" | "opd";
  name: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DetailRow[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    setRows(null);
    const ctrl = new AbortController();
    fetch(`/api/aduan/detail?type=${type}&name=${encodeURIComponent(name)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRows(d.rows ?? []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [open, type, name]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
        title="Klik untuk melihat detail aduan"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-4xl rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Detail Aduan</h3>
                <p className="text-xs text-slate-500">{name}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-5 py-4">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memuat detail aduan...
                </div>
              )}
              {error && <p className="py-8 text-center text-sm text-red-500">{error}</p>}
              {!loading && !error && rows && rows.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">Tidak ada data aduan</p>
              )}
              {!loading && !error && rows && rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Ticket ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Kelurahan</th>
                        <th className="px-4 py-3">Layanan</th>
                        <th className="px-4 py-3">Durasi Penyelesaian</th>
                        <th className="px-4 py-3">Waktu Aduan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((a) => {
                        const status = a.status ?? "Unknown";
                        return (
                          <tr key={String(a.ticketid)} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{a.ticketid}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{a.kelurahan ?? "-"}</td>
                            <td className="px-4 py-3 text-slate-600">{a.Layanan ?? "-"}</td>
                            <td className="px-4 py-3 text-slate-600">{formatMenit(a.durasi_replies_first_last)}</td>
                            <td className="px-4 py-3 text-slate-600">{fmtTanggal(a.waktu_aduan)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {rows.length >= 500 && (
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Menampilkan 500 aduan terbaru (maksimum)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}