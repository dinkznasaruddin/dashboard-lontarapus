"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function YearSelect({
  years,
  selected,
}: {
  years: number[];
  selected: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tahun", e.target.value);
        router.push(`/?${params.toString()}`);
      }}
      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500"
      title="Pilih Tahun"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}