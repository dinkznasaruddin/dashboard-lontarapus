import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  tahunIni: number;
  change: React.ReactNode;
  icon: LucideIcon;
  color: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
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
      {href ? (
        <div
          className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2 text-xs font-semibold"
          style={{ color }}
        >
          Selengkapnya
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      ) : null}
    </>
  );

  const cls = cn(
    "group h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition",
    href && "hover:shadow-md",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn("block h-full rounded-lg", className?.includes("hover:border") && "")} title={`Lihat detail ${label}`}>
        <div className={cls} style={{ borderLeft: `4px solid ${color}` }}>
          {body}
        </div>
      </Link>
    );
  }

  return (
    <div className={cls} style={{ borderLeft: `4px solid ${color}` }}>
      {body}
    </div>
  );
}