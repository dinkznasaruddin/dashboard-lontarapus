"use client";

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  return (
    <form method="GET" className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-slate-600">Urutkan berdasarkan:</label>
      <select
        name="sort"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}