export interface DoughnutSlice {
  label: string;
  value: number;
  color: string;
}

/** Doughnut chart SVG (padanan Chart.js cutout). */
export function DoughnutChart({
  data,
  size = 210,
  thickness = 32,
}: {
  data: DoughnutSlice[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const len = (d.value / total) * c;
      const seg = { ...d, len, offset: -acc };
      acc += len;
      return seg;
    });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e9ecef" strokeWidth={thickness} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={`${s.len} ${c - s.len}`}
          strokeDashoffset={s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        >
          <title>{`${s.label}: ${s.value.toLocaleString("id-ID")}`}</title>
        </circle>
      ))}
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#5a5c69"
      >
        {total.toLocaleString("id-ID")}
      </text>
    </svg>
  );
}

/** Bar chart vertikal (padanan Chart.js bar sederhana). */
export function BarChart({
  labels,
  values,
  color,
  colors,
  height = 300,
}: {
  labels: string[];
  values: number[];
  color?: string;
  /** Warna per-baris (opsional; menang jika diberikan). */
  colors?: string[];
  height?: number;
}) {
  const W = 700;
  const H = height;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxRaw = Math.max(1, ...values);
  const step = Math.pow(10, Math.floor(Math.log10(maxRaw)));
  const niceMax = Math.ceil(maxRaw / step) * step;
  const yTicks = 5;
  const n = labels.length;
  const gap = n <= 1 ? plotW : plotW / n;
  const bw = Math.min(38, gap * 0.6);
  const yFor = (v: number) => padT + plotH - (plotH * v) / niceMax;
  const labelY = H - 10;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {Array.from({ length: yTicks }).map((_, i) => {
        const v = (niceMax * i) / (yTicks - 1);
        const y = yFor(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eaeaf0" strokeWidth={1} strokeDasharray="2 2" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#858796">
              {Math.round(v).toLocaleString("id-ID")}
            </text>
          </g>
        );
      })}
      {labels.map((lb, i) => {
        const x = padL + gap * i + gap / 2;
        const v = values[i] ?? 0;
        const y = yFor(v);
        const short = lb.length > 14 ? `${lb.slice(0, 12)}…` : lb;
        const fill = colors ? colors[i] ?? color ?? "#4e73df" : color ?? "#4e73df";
        return (
          <g key={i}>
            <rect x={x - bw / 2} y={y} width={bw} height={Math.max(0, plotH - (y - padT))} rx={3} fill={fill}>
              <title>{`${lb}: ${v.toLocaleString("id-ID")}`}</title>
            </rect>
            <text
              x={x}
              y={labelY}
              textAnchor="start"
              fontSize="11"
              fill="#858796"
              transform={`rotate(-45 ${x} ${labelY})`}
            >
              {short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Bar horizontal sederhana (padanan Chart.js horizontalBar). */
export function BarList({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-xs font-medium text-slate-600" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-semibold text-slate-700">
            {d.value.toLocaleString("id-ID")}
          </span>
        </div>
      ))}
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Tidak ada data.</p>
      ) : null}
    </div>
  );
}

/** Bar chart harian dengan garis rata-rata (padanan dailyChart lama). */
export function DailyBarChart({
  labels,
  values,
  avg,
  avgUntil = values.length,
  height = 300,
}: {
  labels: string[];
  values: number[];
  avg: number;
  avgUntil?: number;
  height?: number;
}) {
  const W = 700;
  const H = height;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxRaw = Math.max(1, ...values, avg);
  const step = Math.pow(10, Math.floor(Math.log10(maxRaw)));
  const niceMax = Math.ceil(maxRaw / step) * step;
  const yTicks = 5;
  const n = labels.length;
  const gap = n <= 1 ? plotW : plotW / n;
  const bw = Math.min(10, gap * 0.6);
  const yFor = (v: number) => padT + plotH - (plotH * v) / niceMax;
  const avgY = yFor(avg);

  const colorFor = (v: number) => {
    if (v < avg) return "#17a2b8";
    if (v === avg) return "#ffc107";
    return "#dc3545";
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {Array.from({ length: yTicks }).map((_, i) => {
        const v = (niceMax * i) / (yTicks - 1);
        const y = yFor(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eaeaf0" strokeWidth={1} strokeDasharray="2 2" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#858796">
              {Math.round(v).toLocaleString("id-ID")}
            </text>
          </g>
        );
      })}

      <line
        x1={padL}
        y1={avgY}
        x2={padL + (plotW * avgUntil) / n}
        y2={avgY}
        stroke="#ffc107"
        strokeWidth={2}
        strokeDasharray="6 3"
      />

      {values.map((v, i) => {
        const x = padL + gap * i + gap / 2;
        const y = yFor(v);
        return (
          <rect
            key={i}
            x={x - bw / 2}
            y={y}
            width={bw}
            height={Math.max(0, plotH - (y - padT))}
            rx={1}
            fill={colorFor(v)}
          >
            <title>{`${labels[i]}: ${v.toLocaleString("id-ID")} aduan`}</title>
          </rect>
        );
      })}

      {values.map((v, i) => {
        if (i % Math.ceil(n / 15) !== 0) return null;
        const x = padL + gap * i + gap / 2;
        return (
          <text key={`l${i}`} x={x} y={H - 8} textAnchor="middle" fontSize="9" fill="#858796">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}