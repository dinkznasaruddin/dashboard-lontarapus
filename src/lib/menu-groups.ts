/** Grup menu akses akun — sinkron dengan struktur menu lama (includes/sidebar.php). */
export interface MenuGroupDef {
  name: string;
  items: { key: string; label: string }[];
}

export const MENU_GROUPS: MenuGroupDef[] = [
  {
    name: "Dashboard",
    items: [{ key: "dashboard", label: "Dashboard Utama" }],
  },
  {
    name: "Master Data",
    items: [
      { key: "master_data", label: "Master Data (Parent)" },
      { key: "event", label: "└─ Event" },
      { key: "berita", label: "└─ Berita" },
      { key: "akun", label: "└─ Manajemen Akun" },
    ],
  },
  {
    name: "Makassar Move",
    items: [
      { key: "makassar_move", label: "Makassar Move (Parent)" },
      { key: "event_management", label: "└─ Event Management" },
      { key: "event_management_staging", label: "└─ Event Management (Staging)" },
      { key: "makassar_move_leaderboard", label: "└─ Leaderboard" },
    ],
  },
  {
    name: "Dashboard Aduan",
    items: [
      { key: "dashboard_aduan", label: "Dashboard Aduan Utama" },
      { key: "dashboard_aduan_opd", label: "└─ Per OPD" },
      { key: "dashboard_aduan_kategori", label: "└─ Per Kategori" },
      { key: "maps-aduan", label: "└─ Peta Aduan" },
    ],
  },
  {
    name: "Dashboard Register",
    items: [{ key: "dashboard_register", label: "Dashboard Register" }],
  },
  {
    name: "Dashboard Event",
    items: [
      { key: "dashboard_jalan_santai", label: "Jalan Santai" },
      { key: "dashboard_hut", label: "HUT Kota Makassar" },
      { key: "data_asn", label: "Data ASN/Pegawai" },
    ],
  },
  {
    name: "Dashboard SPMB",
    items: [
      { key: "dashboard_registrasi", label: "Registrasi SPMB" },
      { key: "dashboard_demografi", label: "Demografi SPMB" },
      { key: "dashboard_disabililitas", label: "Disabilitas SPMB" },
      { key: "dashboard_seragam", label: "Seragam SPMB" },
      { key: "dashboard_map", label: "Map SPMB" },
    ],
  },
  {
    name: "Google Analytics",
    items: [
      { key: "analitycs_spmb", label: "Analytics SPMB" },
      { key: "analitycs_lontara_mobile", label: "Lontara Mobile" },
      { key: "analitycs_harga_pangan", label: "Harga Pangan" },
      { key: "analitycs_lontara_web", label: "Lontara Web" },
      { key: "analitycs_dukcapil", label: "Dukcapil" },
    ],
  },
  {
    name: "Monitoring API",
    items: [{ key: "api_monitoring", label: "Monitoring & Kelola API" }],
  },
];
