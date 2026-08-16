"use client";

export function PetaFilter({
  year,
  kategori,
  status,
  years,
  kategoriOptions,
  statusOptions,
}: {
  year: number;
  kategori: string;
  status: string;
  years: number[];
  kategoriOptions: string[];
  statusOptions: string[];
}) {
  return (
    <form method="GET" className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-slate-600">Tahun</label>
      <select
        name="year"
        defaultValue={year}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <label className="text-sm font-medium text-slate-600">Kategori</label>
      <select
        name="kategori"
        defaultValue={kategori}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Semua Kategori</option>
        {kategoriOptions.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <label className="text-sm font-medium text-slate-600">Status</label>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">Semua Status</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700">
        Filter
      </button>
    </form>
  );
}