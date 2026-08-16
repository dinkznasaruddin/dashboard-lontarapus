"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MultiLineChartJS } from "@/components/chartjs-charts";

interface Series {
  name: string;
  color: string;
  values: number[];
}

interface TrendPayload {
  event: number[];
  aduan: number[];
  register: number[];
}

const SERIES: { key: keyof TrendPayload; name: string; color: string }[] = [
  { key: "event", name: "Event", color: "#4e73df" },
  { key: "aduan", name: "Aduan", color: "#f6c23e" },
  { key: "register", name: "Register", color: "#36b9cc" },
];

export function TrendChart({
  labels,
  years,
  initialYear,
  initialSeries,
  height = 320,
}: {
  labels: string[];
  years: number[];
  initialYear: number;
  initialSeries: Series[];
  height?: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [loading, setLoading] = useState(false);

  async function handleYearChange(next: number) {
    if (next === year || loading) return;
    setYear(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/trend?tahun=${next}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data: TrendPayload = await res.json();
      setSeries(
        SERIES.map((s) => ({
          name: s.name,
          color: s.color,
          values: data[s.key],
        }))
      );
    } catch {
      // Biarkan data lama bila gagal fetch
      setYear(initialYear);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Trend Bulanan {year}
          {loading ? (
            <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : null}
        </h3>
        <div className="flex items-center gap-1">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => handleYearChange(y)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                y === year
                  ? "bg-[#B21D28] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <MultiLineChartJS labels={labels} series={series} height={height} />
      </div>
    </div>
  );
}