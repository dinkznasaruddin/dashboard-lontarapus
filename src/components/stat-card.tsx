import type { LucideIcon } from "lucide-react";

/** Warna accent per tone — padanan warna kartu dashboard utama (SummaryCard). */
const TONE_COLORS: Record<string, string> = {
  blue: "#4e73df",
  green: "#1cc88a",
  red: "#e74a3b",
  amber: "#f6c23e",
  slate: "#858796",
};

/** Kartu ringkasan — gaya sama dengan SummaryCard dashboard utama (border-left 4px berwarna). */
export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: "blue" | "green" | "red" | "amber" | "slate";
}) {
  const color = TONE_COLORS[tone];
  return (
    <div
      className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold uppercase tracking-wide" style={{ color }}>
            {title}
          </div>
          <div className="mt-0.5 truncate text-xl font-bold text-gray-800">{value}</div>
        </div>
        <Icon className="h-7 w-7 shrink-0 text-gray-300" />
      </div>
    </div>
  );
}