"use client";

import { useRouter } from "next/navigation";

/** Selects auto-submit (bulan/tahun harian) — padanan onchange submit di dashboard lama. */
export function DailyFilter({
  month,
  yearDaily,
  year,
  months,
  years,
}: {
  month: number;
  yearDaily: number;
  year: number;
  months: string[];
  years: number[];
}) {
  const router = useRouter();

  function go(params: Record<string, string>) {
    const sp = new URLSearchParams(params);
    router.push(`/aduan?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="text-sm font-medium text-slate-600">
        Bulan
        <select
          name="month"
          defaultValue={month}
          onChange={(e) => go({ year: String(year), month: e.target.value, year_daily: String(yearDaily) })}
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {months.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-600">
        Tahun (Harian)
        <select
          name="year_daily"
          defaultValue={yearDaily}
          onChange={(e) => go({ year: String(year), month: String(month), year_daily: e.target.value })}
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
    </div>
  );
}