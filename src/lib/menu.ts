import type { SessionUser } from "@/lib/auth";

export interface MenuItem {
  key: string;
  label: string;
  href: string;
  /** Menu keys yang mengizinkan akses (superadmin selalu diizinkan). */
  accessKeys: string[];
  /** Khusus superadmin. */
  superadminOnly?: boolean;
}

export interface MenuGroup {
  key: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

export const MENU: MenuGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "tachometer",
    items: [{ key: "dashboard", label: "Dashboard", href: "/", accessKeys: ["dashboard"] }],
  },
  {
    key: "master_data",
    label: "Master Data",
    icon: "cog",
    items: [
      { key: "event", label: "Event", href: "/master-data/event", accessKeys: ["event"] },
      {
        key: "akun",
        label: "Manajemen Akun",
        href: "/akun",
        accessKeys: ["akun"],
        superadminOnly: true,
      },
    ],
  },
  {
    key: "makassar_move",
    label: "Makassar Move",
    icon: "running",
    items: [
      {
        key: "event_management",
        label: "Event Management",
        href: "/makassar-move/event-management",
        accessKeys: ["makassar_move", "event", "event_management"],
      },
      {
        key: "event_management_staging",
        label: "Event Staging",
        href: "/makassar-move/staging",
        accessKeys: ["makassar_move", "event_management_staging"],
      },
    ],
  },
  {
    key: "aduan",
    label: "Dashboard Aduan",
    icon: "bullhorn",
    items: [
      { key: "dashboard_aduan", label: "Dashboard Utama", href: "/aduan", accessKeys: ["dashboard_aduan"] },
      {
        key: "dashboard_aduan_opd",
        label: "Per OPD",
        href: "/aduan/opd",
        accessKeys: ["dashboard_aduan_opd"],
      },
      {
        key: "dashboard_aduan_kategori",
        label: "Per Kategori",
        href: "/aduan/kategori",
        accessKeys: ["dashboard_aduan_kategori"],
      },
      {
        key: "maps-aduan",
        label: "Peta Aduan",
        href: "/aduan/peta",
        accessKeys: ["dashboard_aduan", "dashboard_aduan_kelurahan", "dashboard_aduan_opd", "dashboard_aduan_kategori"],
      },
    ],
  },
  {
    key: "laporan_email",
    label: "Laporan Email",
    icon: "mail",
    items: [
      {
        key: "email_laporan",
        label: "Kirim Laporan Email",
        href: "/laporan-email",
        accessKeys: ["dashboard_aduan", "dashboard_aduan_opd", "dashboard_aduan_kategori", "dashboard_register", "dashboard_jalan_santai", "dashboard_hut", "data_asn"],
      },
    ],
  },
  {
    key: "register",
    label: "Dashboard Register",
    icon: "users",
    items: [{ key: "dashboard_register", label: "Data Register", href: "/register", accessKeys: ["dashboard_register"] }],
  },
  {
    key: "event_dashboard",
    label: "Dashboard Event",
    icon: "calendar",
    items: [
      {
        key: "dashboard_jalan_santai",
        label: "Jalan Sehat",
        href: "/event/jalan-santai",
        accessKeys: ["dashboard_jalan_santai"],
      },
      { key: "dashboard_hut", label: "HUT Kota Makassar", href: "/event/hut", accessKeys: ["dashboard_hut"] },
      { key: "data_asn", label: "Data Pegawai", href: "/event/asn", accessKeys: ["data_asn"] },
    ],
  },
  {
    key: "spmb",
    label: "Dashboard SPMB",
    icon: "graduation-cap",
    items: [
      { key: "dashboard_registrasi", label: "Pendaftaran Akun (2025)", href: "/spmb/2025/registrasi", accessKeys: ["dashboard_registrasi"] },
      { key: "dashboard_registrasi_id", label: "Registrasi Data ID (2025)", href: "/spmb/2025/registrasi-id", accessKeys: ["dashboard_registrasi"] },
      { key: "dashboard_data_nik", label: "Registrasi Data NIK (2025)", href: "/spmb/2025/data-nik", accessKeys: ["dashboard_registrasi"] },
      { key: "dashboard_data_tk", label: "Data TK (2025)", href: "/spmb/2025/data-tk", accessKeys: ["dashboard_seragam"] },
      { key: "dashboard_data_sd", label: "Data SD (2025)", href: "/spmb/2025/data-sd", accessKeys: ["dashboard_seragam"] },
      { key: "dashboard_data_smp", label: "Data SMP (2025)", href: "/spmb/2025/data-smp", accessKeys: ["dashboard_seragam"] },
      { key: "dashboard_map", label: "Mapping (2025)", href: "/spmb/2025/mapping", accessKeys: ["dashboard_map"] },
      { key: "dashboard_domisili", label: "Overview Domisili (2026)", href: "/spmb/2026/domisili", accessKeys: ["dashboard_registrasi"] },
      { key: "dashboard_pantau_spmb", label: "Pantau SPMB (2026)", href: "/spmb/2026/pantau", accessKeys: ["dashboard_registrasi"] },
    ],
  },
  {
    key: "analytics",
    label: "Google Analytics",
    icon: "chart",
    items: [
      { key: "analitycs_spmb", label: "Analytics SPMB", href: "/analytics/spmb", accessKeys: ["analitycs_spmb"] },
      {
        key: "analitycs_lontara_mobile",
        label: "Lontara Mobile",
        href: "/analytics/lontara-mobile",
        accessKeys: ["analitycs_lontara_mobile"],
      },
      {
        key: "analitycs_harga_pangan",
        label: "Harga Pangan",
        href: "/analytics/harga-pangan",
        accessKeys: ["analitycs_harga_pangan"],
      },
      {
        key: "analitycs_lontara_web",
        label: "Lontara Web",
        href: "/analytics/lontara-web",
        accessKeys: ["analitycs_lontara_web"],
      },
      {
        key: "analitycs_dukcapil",
        label: "Dukcapil",
        href: "/analytics/dukcapil",
        accessKeys: ["analitycs_dukcapil"],
      },
    ],
  },
  {
    key: "monitoring_api",
    label: "Monitoring API",
    icon: "heartbeat",
    items: [
      { key: "api_monitoring", label: "Monitoring", href: "/monitoring-api", accessKeys: ["api_monitoring"] },
      { key: "api_history", label: "Riwayat Pengecekan", href: "/monitoring-api/riwayat", accessKeys: ["api_monitoring"] },
      {
        key: "api_manage",
        label: "Kelola Data API",
        href: "/monitoring-api/kelola",
        accessKeys: ["api_monitoring"],
        superadminOnly: true,
      },
      { key: "cuaca", label: "Layanan Cuaca", href: "/cuaca-api", accessKeys: ["api_monitoring"] },
    ],
  },
];

/** Filter menu sesuai akses user. */
export function getAccessibleMenu(session: SessionUser | null): MenuGroup[] {
  if (!session) return [];
  return MENU.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.superadminOnly) return session.role === "superadmin";
      return hasAnyKey(session, item.accessKeys);
    }),
  })).filter((group) => group.items.length > 0);
}

function hasAnyKey(session: SessionUser, keys: string[]): boolean {
  if (session.role === "superadmin") return true;
  return keys.some((k) => session.menuAccess.includes(k));
}
