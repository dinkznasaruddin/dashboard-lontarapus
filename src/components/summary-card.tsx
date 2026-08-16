import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

/** Persentase perubahan — padanan formatPercentageChange() di index.php lama. */
export function PercentChange({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) {
    if (current > 0) {
      return (
        <span className="ml-2 text-xs font-semibold text-emerald-600">
          <ArrowUp className="inline h-3 w-3" /> 100%
        </span>
      );
    }
    return <span className="ml-2 text-xs font-semibold text-slate-400">--</span>;
  }

  const pct = ((current - previous) / previous) * 100;

  if (pct > 0) {
    return (
      <span className="ml-2 text-xs font-semibold text-emerald-600">
        <ArrowUp className="inline h-3 w-3" /> {pct.toFixed(1)}%
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="ml-2 text-xs font-semibold text-red-600">
        <ArrowDown className="inline h-3 w-3" /> {Math.abs(pct).toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="ml-2 text-xs font-semibold text-amber-500">
      <Minus className="inline h-3 w-3" /> 0%
    </span>
  );
}

/** Kartu ringkasan — padanan card border-left SB Admin (Total Event/Berita/Aduan/Register). */
export function SummaryCard({
  label,
  value,
  tahunIni,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: React.ReactNode;
  tahunIni: number;
  change: React.ReactNode;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div
      className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
            {label}
          </div>
          <div className="mt-0.5 text-xl font-bold text-gray-800">{value}</div>
          <div className="mt-0.5 text-xs font-bold text-gray-800">
            Tahun Ini: {tahunIni.toLocaleString("id-ID")}
            {change}
          </div>
        </div>
        <Icon className="h-7 w-7 shrink-0 text-gray-300" />
      </div>
    </div>
  );
}