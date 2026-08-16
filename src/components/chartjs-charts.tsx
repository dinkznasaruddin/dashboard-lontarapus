"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart,
  Line,
  Bar,
  Doughnut,
} from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

export interface PieDatum {
  label: string;
  value: number;
  color: string;
}

const TOOLTIP_BG = "rgba(0, 0, 0, 0.8)";

/* ------------------------- Monthly trend (line) ------------------------- */
export function MonthlyTrendChart({
  labels,
  total,
  selesai,
  proses,
}: {
  labels: string[];
  total: number[];
  selesai: number[];
  proses: number[];
}) {
  const data = {
    labels,
    datasets: [
      {
        label: "Total Aduan",
        data: total,
        borderColor: "#4e73df",
        backgroundColor: "rgba(78, 115, 223, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#4e73df",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Aduan Selesai",
        data: selesai,
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#28a745",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
      {
        label: "In Progress",
        data: proses,
        borderColor: "#ffc107",
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#ffc107",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    animation: { duration: 1000, easing: "easeOutQuart" as const },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          stepSize: 1000,
          callback: (value: number | string) => `${Number(value)} aduan`,
        },
      },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { position: "top" as const, align: "end" as const, labels: { usePointStyle: true, padding: 15, boxWidth: 8 } },
      tooltip: { backgroundColor: TOOLTIP_BG, padding: 10, cornerRadius: 6 },
      datalabels: { display: false },
    },
  };

  return (
    <div className="relative h-[300px] w-full">
      <Line data={data} options={options as any} />
    </div>
  );
}

/* --------------------------- Status doughnut ---------------------------- */
export function StatusDoughnut({ data }: { data: PieDatum[] }) {
  const d = {
    labels: data.map((x) => x.label),
    datasets: [
      {
        data: data.map((x) => x.value),
        backgroundColor: data.map((x) => x.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[320px]">
      <Doughnut
        data={d}
        options={
          {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, boxWidth: 8 } },
              tooltip: { backgroundColor: TOOLTIP_BG },
              datalabels: { display: false },
            },
          } as any
        }
      />
    </div>
  );
}

/* ------------------- Daily bar + average line (combo) ------------------- */
export function DailyChart({
  labels,
  values,
  avgArray,
}: {
  labels: string[];
  values: number[];
  avgArray: (number | null)[];
}) {
  const total = values.reduce((a, b) => a + b, 0);
  const maxRaw = Math.max(1, ...values, ...avgArray.filter((v): v is number => v !== null));
  const maxDaily = maxRaw;
  const avgDaily = avgArray[0] ?? 0;
  const colors = values.map((v) =>
    v < avgDaily ? "#17a2b8" : v === avgDaily ? "#ffc107" : "#dc3545"
  );

  const data = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Jumlah Aduan",
        data: values,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 1,
        order: 2,
      },
      {
        type: "line" as const,
        label: "Rata-rata",
        data: avgArray,
        borderColor: "#ff6384",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          stepSize: 10,
          callback: (value: number | string) => (Math.floor(Number(value)) === Number(value) ? value : ""),
        },
      },
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 31 } },
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: { usePointStyle: true, padding: 15, boxWidth: 8 },
      },
      tooltip: {
        backgroundColor: TOOLTIP_BG,
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.datasetIndex === 1) return `Rata-rata: ${Number(ctx.parsed.y).toFixed(1)} aduan/hari`;
            const pct = total > 0 ? ((Number(ctx.parsed.y) / total) * 100).toFixed(1) : 0;
            return `Jumlah Aduan: ${ctx.parsed.y} (${pct}%)`;
          },
        },
      },
      datalabels: {
        display: (ctx: any) => {
          if (maxDaily === 0 || ctx.datasetIndex !== 0) return false;
          return Number(ctx.dataset.data[ctx.dataIndex]) > maxDaily * 0.5;
        },
        anchor: "end" as const,
        align: "top" as const,
        offset: 2,
        color: "#333",
        font: { size: 9, weight: "bold" as const },
        formatter: (v: number) => (v > 0 ? v : ""),
      },
    },
  };

  return (
    <div className="relative h-[300px] w-full">
      <Bar data={data as any} options={options as any} />
    </div>
  );
}

/* --------------------- Kategori horizontal bar -------------------------- */
export function KategoriBar({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Jumlah Aduan",
        data: values,
        backgroundColor: "#1cc88a",
        hoverBackgroundColor: "#17a673",
        borderColor: "#1cc88a",
      },
    ],
  };
  return (
    <div className="relative h-[300px] w-full">
      <Bar
        data={data}
        options={
          {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
              x: {
                beginAtZero: true,
                ticks: { callback: (v: number | string) => (Math.floor(Number(v)) === Number(v) ? v : "") },
              },
              y: { ticks: { maxRotation: 0, minRotation: 0 } },
            },
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: TOOLTIP_BG },
              datalabels: { display: false },
            },
          } as any
        }
      />
    </div>
  );
}

/* --------------------- Durasi first reply doughnut ---------------------- */
export function DurasiDoughnut({ data }: { data: PieDatum[] }) {
  const d = {
    labels: data.map((x) => x.label),
    datasets: [
      {
        data: data.map((x) => x.value),
        backgroundColor: data.map((x) => x.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[320px]">
      <Doughnut
        data={d}
        options={
          {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, boxWidth: 8 } },
              tooltip: { backgroundColor: TOOLTIP_BG },
              datalabels: { display: false },
            },
          } as any
        }
      />
    </div>
  );
}

/* --------------------- Durasi penyelesaian bar -------------------------- */
export function DurasiBar({ labels, values, colors }: { labels: string[]; values: number[]; colors: string[] }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Jumlah Aduan",
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map((c) => c),
        borderColor: colors,
      },
    ],
  };
  return (
    <div className="relative h-[300px] w-full">
      <Bar
        data={data}
        options={
          {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { maxRotation: 0 } },
              y: { beginAtZero: true, ticks: { callback: (v: number | string) => (Math.floor(Number(v)) === Number(v) ? v : "") } },
            },
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: TOOLTIP_BG },
              datalabels: { display: false },
            },
          } as any
        }
      />
    </div>
  );
}

/* --------------------- Line chart generik (mis. bulanan) ----------------- */
export function LineChartJS({
  labels,
  label,
  values,
  color = "#4e73df",
  height = 300,
  datalabels = false,
}: {
  labels: string[];
  label: string;
  values: number[];
  color?: string;
  height?: number;
  datalabels?: boolean;
}) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}1A`,
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: color,
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    animation: { duration: 1000, easing: "easeOutQuart" as const },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: TOOLTIP_BG, padding: 10, cornerRadius: 6 },
      datalabels: { display: datalabels },
    },
  };
  return (
    <div className="relative w-full" style={{ height }}>
      <Line data={data} options={options as any} />
    </div>
  );
}

/* ------------------ Multi-line generik (trend gabungan) ------------------ */
export function MultiLineChartJS({
  labels,
  series,
  height = 300,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.name,
      data: s.values,
      borderColor: s.color,
      backgroundColor: `${s.color}1A`,
      borderWidth: 3.5,
      pointBackgroundColor: s.color,
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 4.5,
      pointHoverRadius: 7,
      tension: 0.3,
      fill: false,
    })),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    animation: { duration: 1000, easing: "easeOutQuart" as const },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(234, 236, 244, 1)" },
        ticks: {
          maxTicksLimit: 5,
          callback: (value: number | string) => Number(value).toLocaleString("id-ID"),
        },
      },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { position: "top" as const, labels: { usePointStyle: true, padding: 15, boxWidth: 8 } },
      tooltip: { backgroundColor: TOOLTIP_BG, padding: 10, cornerRadius: 6, intersect: false },
      datalabels: { display: false },
    },
  };
  return (
    <div className="relative w-full" style={{ height }}>
      <Line data={data} options={options as any} />
    </div>
  );
}

/* -------------------- Doughnut generik (mis. realisasi) ------------------- */
export function DoughnutChartJS({ data, height = 240 }: { data: PieDatum[]; height?: number }) {
  const d = {
    labels: data.map((x) => x.label),
    datasets: [
      {
        data: data.map((x) => x.value),
        backgroundColor: data.map((x) => x.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  return (
    <div className="relative mx-auto w-full" style={{ height, maxWidth: height + 40 }}>
      <Doughnut
        data={d}
        options={
          {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, boxWidth: 8 } },
              tooltip: { backgroundColor: TOOLTIP_BG },
              datalabels: { display: false },
            },
          } as any
        }
      />
    </div>
  );
}

/* ----------------------- Bar vertikal generik ---------------------------- */
export function BarChartJS({
  labels,
  values,
  color = "#1cc88a",
  colors,
  height = 300,
  horizontal = false,
  datalabels = false,
}: {
  labels: string[];
  values: number[];
  color?: string;
  colors?: string[];
  height?: number;
  horizontal?: boolean;
  datalabels?: boolean;
}) {
  const data = {
    labels,
    datasets: [
      {
        label: "Jumlah",
        data: values,
        backgroundColor: colors ?? color,
        hoverBackgroundColor: colors ?? color,
        borderColor: colors ?? color,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ("y" as const) : undefined,
    scales: {
      x: horizontal
        ? { beginAtZero: true, grid: { display: false } }
        : { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
      y: horizontal
        ? { grid: { color: "rgba(0, 0, 0, 0.05)" }, ticks: { maxRotation: 0, minRotation: 0 } }
        : { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: TOOLTIP_BG },
      datalabels: { display: datalabels },
    },
  };
  return (
    <div className="relative w-full" style={{ height }}>
      <Bar data={data as any} options={options as any} />
    </div>
  );
}

export { Chart, ChartJS };