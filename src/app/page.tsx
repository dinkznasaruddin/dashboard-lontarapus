import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, MessagesSquare, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Beranda",
};

const FEATURES = [
  { icon: MessagesSquare, label: "Data Aduan" },
  { icon: CalendarDays, label: "Event & Kegiatan" },
  { icon: BarChart3, label: "Register & Statistik" },
  { icon: ShieldCheck, label: "Monitoring Layanan" },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fafbfc]">
      {/* Dekorasi background */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#B21D28]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -right-40 h-[560px] w-[560px] rounded-full bg-blue-700/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-500/5 blur-3xl" />

      {/* Konten utama */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/logo-lontara.png"
            alt="Lontara+"
            className="w-56 h-auto object-contain"
          />
          <span className="inline-flex w-56 items-center justify-center rounded-full border border-[#B21D28]/15 bg-[#B21D28]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#B21D28]">
            Satu Kota <span className="mx-1 font-light opacity-60">|</span> Satu App
          </span>
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-[#16213a] sm:text-5xl md:text-6xl">
          Dashboard{" "}
          <span className="bg-gradient-to-r from-[#d02b29] via-[#b92321] to-[#8f1d1b] bg-clip-text text-transparent">
            Lontara+
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#667085] sm:text-lg">
          Platform terpadu untuk memantau seluruh layanan publik Pemerintah Kota
          Makassar — aduan masyarakat, event, hingga data registrasi dalam satu tampilan.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
            >
              <Icon className="h-4 w-4 text-[#B21D28]" />
              {label}
            </span>
          ))}
        </div>

        <Link
          href="/login"
          className="group mt-11 inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#d02b29] to-[#b92321] px-9 text-base font-semibold text-white shadow-lg shadow-red-700/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-700/30"
        >
          Masuk ke Dashboard
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center text-xs text-slate-400">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-slate-500 shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Data pribadi Anda terlindungi sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP).
        </div>
        <p>© {new Date().getFullYear()} Pemerintah Kota Makassar · Lontara+</p>
      </footer>
    </div>
  );
}
