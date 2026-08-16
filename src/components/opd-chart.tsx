"use client";

import { useState } from "react";
import { BarChartJS } from "@/components/chartjs-charts";

interface OpdChartDatum {
  label: string;
  value: number;
  formatted?: string;
}

export function OpdChartCard({
  byCount,
  fastest,
  slowest,
}: {
  byCount: OpdChartDatum[];
  fastest: OpdChartDatum[];
  slowest: OpdChartDatum[];
}) {
  const [mode, setMode] = useState<"count" | "fastest" | "slowest">("count");

  const data =
    mode === "count" ? byCount : mode === "fastest" ? fastest : slowest;

  const title =
    mode === "count"
      ? "Top 15 OPD dengan Jumlah Aduan Tertinggi"
      : mode === "fastest"
        ? "Top 15 OPD dengan Penyelesaian Tercepat"
        : "Top 15 OPD dengan Penyelesaian Terlama";

  const color =
    mode === "count" ? "#4e73df" : mode === "fastest" ? "#1cc88a" : "#e74a3b";

  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "count" | "fastest" | "slowest")}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="count">Jumlah Aduan Tertinggi</option>
          <option value="fastest">Penyelesaian Tercepat</option>
          <option value="slowest">Penyelesaian Terlama</option>
        </select>
      </div>
      {data.length > 0 ? (
        <BarChartJS labels={labels} values={values} color={color} height={400} />
      ) : (
        <p className="py-10 text-center text-sm text-slate-400">Tidak ada data tersedia.</p>
      )}
    </div>
  );
}