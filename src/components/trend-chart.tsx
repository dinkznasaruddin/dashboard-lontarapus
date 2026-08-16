"use client";

import { useState, type MouseEvent } from "react";

export interface TrendSeries {
  name: string;
  color: string;
  values: number[];
}

/** Line chart interaktif: tooltip saat hover + legend klik untuk tampil/sembunyikan. */
export function TrendChart({
  labels,
  series,
  height = 260,
}: {
  labels: string[];
  series: TrendSeries[];
  height?: number;
}) {
  const W = 700;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 12;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxRaw = Math.max(1, ...series.flatMap((s) => s.values));
  const step = Math.pow(10, Math.floor(Math.log10(maxRaw)));
  const niceMax = Math.ceil(maxRaw / step) * step;
  const yTicks = 5;

  const xFor = (i: number) =>
    padL + (labels.length <= 1 ? 0 : (plotW * i) / (labels.length - 1));
  const yFor = (v: number) => padT + plotH - (plotH * v) / niceMax;

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<number | null>(null);

  const toggle = (name: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const visible = series.filter((s) => !hidden.has(s.name));

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbX = (e.clientX - rect.left) * (W / rect.width);
    const idx = Math.round((vbX - padL) / (plotW / (labels.length - 1)));
    setHover(Math.max(0, Math.min(labels.length - 1, idx)));
  };

  const leftPct =
    hover === null ? 0 : Math.min(92, Math.max(8, (xFor(hover) / W) * 100));
  const tx = hover === null ? "-50%" : leftPct < 20 ? "0%" : leftPct > 80 ? "-100%" : "-50%";

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full cursor-crosshair"
        role="img"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: yTicks }).map((_, i) => {
          const v = (niceMax * i) / (yTicks - 1);
          const y = yFor(v);
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#eaeaf0"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#858796">
                {Math.round(v).toLocaleString("id-ID")}
              </text>
            </g>
          );
        })}

        {labels.map((lb, i) => (
          <text key={lb} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#858796">
            {lb}
          </text>
        ))}

        {visible.map((s) => {
          const pts = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r={hover === i ? 4.5 : 3}
                  fill={s.color}
                >
                  <title>{`${s.name} ${labels[i]}: ${v.toLocaleString("id-ID")}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {hover !== null && (
          <line
            x1={xFor(hover)}
            y1={padT}
            x2={xFor(hover)}
            y2={H - padB}
            stroke="#dddfeb"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-3 z-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
          style={{ left: `${leftPct}%`, transform: `translateX(${tx})` }}
        >
          <p className="mb-1 text-xs font-bold text-slate-700">{labels[hover]}</p>
          {visible.length === 0 ? (
            <p className="text-xs text-slate-400">Semua dataset disembunyikan</p>
          ) : (
            visible.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium">{s.name}:</span>
                <span className="font-bold">{s.values[hover].toLocaleString("id-ID")}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {series.map((s) => {
          const off = hidden.has(s.name);
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => toggle(s.name)}
              title={off ? `Tampilkan ${s.name}` : `Sembunyikan ${s.name}`}
              className={`flex items-center gap-1.5 text-xs transition ${
                off ? "text-slate-400 line-through opacity-60" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}