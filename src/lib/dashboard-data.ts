import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { fetchRegister } from "@/lib/apis";
import { getAllAduan } from "@/lib/aduan-server";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TREND_YEAR_MIN = 2025;
const EMPTY_MONTHS = Array(12).fill(0);

const STATUS_EVENT_LABEL: Record<number, string> = {
  1: "Akan Datang",
  2: "Sedang Berlangsung",
  3: "Selesai",
};
const STATUS_EVENT_COLOR: Record<string, string> = {
  "Akan Datang": "#4e73df",
  "Sedang Berlangsung": "#1cc88a",
  Selesai: "#858796",
};
export { STATUS_EVENT_COLOR };

interface EventRow {
  created_at: string;
  status: number;
}

export interface DashboardData {
  event: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    statusCounts: Record<string, number>;
    ok: boolean;
  };
  aduan: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    status: { label: string; value: number }[];
    kategori: { label: string; value: number }[];
  };
  register: {
    total: number;
    tahunIni: number;
    tahunLalu: number;
    perBulan: number[];
    summaryOk: boolean;
  };
  apiStatus: { key: string; status: string; message: string }[];
}

export const loadDashboardData = unstable_cache(
  async (filterYear: number, currentYear: number): Promise<DashboardData> => {
    const today = new Date();
    const lastYear = currentYear - 1;

    /* ------------------------------- 1. EVENT ------------------------------- */
    const event: DashboardData["event"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      statusCounts: { "Akan Datang": 0, "Sedang Berlangsung": 0, Selesai: 0 },
      ok: false,
    };
    try {
      const rows = await query<EventRow>("SELECT created_at, status FROM tb_event");
      event.ok = true;
      event.total = rows.length;
      for (const r of rows) {
        const d = new Date(r.created_at);
        if (isNaN(+d)) continue;
        const y = d.getFullYear();
        if (y === currentYear) event.tahunIni++;
        if (y === lastYear) event.tahunLalu++;
        if (y === filterYear) event.perBulan[d.getMonth()]++;
        const label = STATUS_EVENT_LABEL[r.status];
        if (label) event.statusCounts[label]++;
      }
    } catch {}

    /* ------------------------------- 2. ADUAN ------------------------------- */
    const aduan: DashboardData["aduan"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      status: [],
      kategori: [],
    };
    try {
      const items = await getAllAduan();
      aduan.total = items.length;
      const statusMap = new Map<string, number>();
      const katMap = new Map<string, number>();
      for (const a of items) {
        const d = new Date(a.waktu_aduan ?? "");
        if (!isNaN(+d)) {
          const y = d.getFullYear();
          if (y === currentYear) aduan.tahunIni++;
          if (y === lastYear) aduan.tahunLalu++;
          if (y === filterYear) aduan.perBulan[d.getMonth()]++;
        }
        const s = a.status ?? "Unknown";
        statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
        const k = a.kategori ?? "Unknown";
        katMap.set(k, (katMap.get(k) ?? 0) + 1);
      }
      aduan.status = [...statusMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));
      aduan.kategori = [...katMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));
    } catch {}

    /* ------------------------------- 4. REGISTER ---------------------------- */
    const register: DashboardData["register"] = {
      total: 0,
      tahunIni: 0,
      tahunLalu: 0,
      perBulan: [...EMPTY_MONTHS],
      summaryOk: false,
    };
    let bulanIni = 0;
    let monthlyOk = false;
    try {
      const all = await fetchRegister<any>("summary", {});
      const cur = await fetchRegister<any>("summary", { year: String(currentYear) });
      const last = await fetchRegister<any>("summary", { year: String(lastYear) });
      register.summaryOk = !!(cur?.status || all?.status);
      register.total = all?.data?.total ?? 0;
      register.tahunIni = cur?.data?.total ?? 0;
      bulanIni = cur?.data?.month ?? cur?.data?.motnh ?? 0;
      register.tahunLalu = last?.data?.total ?? 0;

      try {
        const byMonth = await fetchRegister<any>("summary-by-registered-month", {
          year: String(filterYear),
        });
        if (Array.isArray(byMonth?.data)) {
          for (const it of byMonth.data) {
            const mi = Number(it.month);
            if (mi >= 1 && mi <= 12) register.perBulan[mi - 1] = Number(it.total ?? 0);
          }
          monthlyOk = true;
        }
      } catch {}
    } catch {
      // Fallback seperti index.php bila API Lontara tidak merespons
      register.summaryOk = false;
      register.total = 4361;
      register.tahunIni = 4361;
      bulanIni = 964;
      register.tahunLalu = 0;
    }

    if (!monthlyOk) {
      const avg = register.tahunIni > 0 ? Math.round(register.tahunIni / 12) : 0;
      for (let i = 0; i < 12; i++) {
        if (i < today.getMonth()) register.perBulan[i] = avg;
        else if (i === today.getMonth()) register.perBulan[i] = bulanIni;
        else register.perBulan[i] = 0;
      }
    }

    /* ---------------------------- STATUS API (2 sumber) ---------------------- */
    const apiStatus = [
      {
        key: "event",
        status: event.ok && event.total > 0 ? "success" : "error",
        message: event.ok && event.total > 0 ? "Connected" : "Database Error",
      },
      {
        key: "register",
        status: register.summaryOk ? "success" : "warning",
        message: register.summaryOk ? "Connected" : "Using Cache",
      },
    ];

    return { event, aduan, register, apiStatus };
  },
  ["lontara-dashboard-summary"],
  { revalidate: 600, tags: ["lontara-summary"] }
);