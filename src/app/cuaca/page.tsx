import { Suspense } from "react";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { getCuaca, type CuacaItem } from "@/lib/cuaca";
import { CuacaMobileSkeleton } from "@/components/skeleton";
import {
  MapPin,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Sun,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  TriangleAlert,
  Activity,
  CalendarDays,
  Clock3,
  ArrowDownUp,
  CheckCircle,
} from "lucide-react";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Info Cuaca Makassar - BMKG",
  description: "Prakiraan cuaca, peringatan dini, dan info gempa dari BMKG",
};

const WEATHER_ICON_MAP: Record<string, typeof Sun> = {
  sun: Sun,
  partly: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
  temp: Thermometer,
};

function weatherKind(desc?: string): string {
  if (!desc) return "temp";
  const map: [string, string][] = [
    ["Cerah Berawan", "partly"],
    ["Hujan Petir", "storm"],
    ["Hujan Lebat", "storm"],
    ["Hujan Ringan", "rain"],
    ["Hujan Sedang", "rain"],
    ["Berawan Tebal", "cloud"],
    ["Berawan", "cloud"],
    ["Berkabut", "fog"],
    ["Cerah", "sun"],
  ];
  for (const [k, v] of map) if (desc.includes(k)) return v;
  return "partly";
}

function WeatherIcon({
  desc,
  className,
}: {
  desc?: string;
  className?: string;
}) {
  const Icon = WEATHER_ICON_MAP[weatherKind(desc)] ?? CloudSun;
  return <Icon className={className} />;
}

/** Ikon cuaca BMKG (SVG) jika tersedia; fallback ke ikon lucide. */
function WeatherIconBmkg({
  image,
  desc,
  className,
}: {
  image?: string;
  desc?: string;
  className?: string;
}) {
  if (!image) return <WeatherIcon desc={desc} className={className} />;
  const src = image.replace(/\s/g, "%20");
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={desc || "cuaca"} className={className} loading="lazy" />;
}

function flatForecast(cuaca: any): CuacaItem[] {
  const days = cuaca?.data?.[0]?.cuaca ?? [];
  const flat: CuacaItem[] = [];
  for (const day of days) for (const item of day) flat.push(item);
  return flat.slice(0, 8);
}

function timeOf(v?: string): string {
  if (!v) return "-";
  const m = /(\d{2}):(\d{2})/.exec(v);
  return m ? `${m[1]}:${m[2]}` : v;
}

export default async function CuacaMobilePage() {
  return (
    <Suspense fallback={<CuacaMobileSkeleton />}>
      <CuacaMobileContent />
    </Suspense>
  );
}

async function CuacaMobileContent() {
  const data = await getCuaca("73.71.01.1001");
  const cuaca = data.weather ?? null;
  const warning = data.warning ?? null;
  const gempa = data.earthquake ?? null;

  const lokasi = cuaca?.lokasi;
  const lokasiLabel = lokasi
    ? `${lokasi.kotkab ?? "Kota Makassar"}, ${lokasi.provinsi ?? ""}`.trim()
    : "Kota Makassar, Sulawesi Selatan";

  const current: CuacaItem | undefined = cuaca?.data?.[0]?.cuaca?.[0]?.[0];
  const forecast = flatForecast(cuaca);

  const nowLabel = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });

  return (
    <main className={`${openSans.variable} min-h-screen bg-white px-5 pb-10 pt-6 font-[var(--font-open-sans)] text-[#1f2937]`}>
      <div className="mx-auto w-full max-w-[480px]">
        {/* Header */}
        <header className="mb-6">
          <p className="flex items-center gap-2 text-[1.05rem] font-medium text-slate-800">
            <MapPin className="h-5 w-5 text-[#B21D28]" />
            <span>{lokasiLabel}</span>
          </p>
        </header>

        <hr className="mb-6 border-t border-slate-300" />

        {/* Prakiraan Cuaca */}
        <section className="mb-9">
          <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold uppercase tracking-wide text-slate-800">
            <CloudSun className="h-5 w-5 text-[#B21D28]" />
            Prakiraan Cuaca
          </h2>

          {!current ? (
            <p className="rounded-xl bg-slate-50 py-5 text-center text-sm text-slate-500">
              Data prakiraan cuaca tidak tersedia saat ini.
            </p>
          ) : (
            <>
              <div className="border-b border-slate-100 pb-6 text-center">
                <WeatherIconBmkg
                  image={current.image}
                  desc={current.weather_desc}
                  className="mx-auto h-[72px] w-[72px]"
                />
                <p className="mt-2 text-[1.05rem] capitalize text-slate-600">
                  Saat ini {current.weather_desc || "N/A"}
                </p>
                <p className="text-6xl font-bold leading-tight text-[#1f2937]">
                  {current.t ?? "N/A"}°C
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 py-6">
                <div className="px-2 text-center">
                  <Droplets className="mx-auto mb-2 h-6 w-6 text-[#B21D28]" />
                  <p className="text-lg font-semibold text-slate-800">{current.hu ?? "N/A"}%</p>
                  <p className="mt-0.5 text-xs text-slate-400">Kelembapan</p>
                </div>
                <div className="px-2 text-center">
                  <Wind className="mx-auto mb-2 h-6 w-6 text-[#B21D28]" />
                  <p className="text-lg font-semibold text-slate-800">{current.ws ?? "N/A"}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Kec. Angin (km/jam)</p>
                </div>
                <div className="px-2 text-center">
                  <Compass className="mx-auto mb-2 h-6 w-6 text-[#B21D28]" />
                  <p className="text-lg font-semibold text-slate-800">
                    {current.wd ?? "N/A"}
                    {current.wd_deg ? ` (${current.wd_deg}°)` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Arah Angin</p>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="mb-3.5 text-[0.95rem] font-semibold text-slate-800">Prakiraan 24 Jam</h3>
                <div className="flex flex-col gap-2.5">
                  {forecast.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3.5"
                    >
                      <span className="w-14 text-sm font-semibold text-slate-700">{timeOf(f.local_datetime)}</span>
                      <span className="flex flex-1 items-center justify-center gap-2 text-[0.9rem] text-slate-600">
                        <WeatherIconBmkg
                          image={f.image}
                          desc={f.weather_desc}
                          className="h-6 w-6"
                        />
                        {f.weather_desc || "N/A"}
                      </span>
                      <span className="w-14 text-right text-base font-bold text-slate-800">{f.t ?? "N/A"}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <hr className="mb-6 border-t border-slate-300" />

        {/* Peringatan Dini */}
        <section className="mb-9">
          <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold uppercase tracking-wide text-slate-800">
            <TriangleAlert className="h-5 w-5 text-[#d02b29]" />
            Peringatan Dini Cuaca
          </h2>

          {!warning?.headline ? (
            <div className="rounded-2xl border border-slate-100 px-5 py-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-[#B21D28]" />
              <p className="mt-3 text-sm text-slate-600">
                Tidak ada peringatan cuaca saat ini.
                <br />
                Kondisi cuaca dalam keadaan normal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border-l-4 border-[#d02b29] bg-red-50/60 px-5 py-4">
                <p className="text-sm font-semibold text-slate-800">{warning.headline}</p>
                {warning.area && (
                  <p className="mt-2 text-sm text-slate-600">
                    <strong>Wilayah:</strong> {warning.area}
                  </p>
                )}
              </div>
              {warning.description && (
                <div className="rounded-2xl border border-slate-100 px-5 py-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Deskripsi:</p>
                  <p className="whitespace-pre-line text-sm text-slate-600">{warning.description}</p>
                </div>
              )}
              {warning.instruction && (
                <div className="rounded-2xl border border-slate-100 px-5 py-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Instruksi:</p>
                  <p className="whitespace-pre-line text-sm text-slate-600">{warning.instruction}</p>
                </div>
              )}
              {warning.web && (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={warning.web}
                    alt="Infografis Peringatan Cuaca"
                    className="w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <hr className="mb-6 border-t border-slate-300" />

        {/* Info Gempa */}
        <section className="mb-9">
          <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold uppercase tracking-wide text-slate-800">
            <Activity className="h-5 w-5 text-[#B21D28]" />
            Info Gempa Wilayah di Indonesia
          </h2>

          {!gempa?.Magnitude ? (
            <div className="rounded-2xl border border-slate-100 px-5 py-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-[#B21D28]" />
              <p className="mt-3 text-sm text-slate-600">Data gempa terkini tidak tersedia saat ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-100 px-5 py-5">
                <div className="flex items-center justify-center gap-6">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] border-[#B21D28]/30 bg-red-50">
                    <span className="text-4xl font-bold leading-none text-[#B21D28]">{gempa.Magnitude}</span>
                    <span className="mt-1 text-xs text-slate-400">SR</span>
                  </div>
                  <div className="space-y-2.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2.5">
                      <CalendarDays className="h-5 w-5 text-[#B21D28]" />
                      {gempa.Tanggal || "N/A"}
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Clock3 className="h-5 w-5 text-[#B21D28]" />
                      {gempa.Jam || "N/A"} WITA
                    </p>
                    <p className="flex items-center gap-2.5">
                      <ArrowDownUp className="h-5 w-5 text-[#B21D28]" />
                      Kedalaman: {gempa.Kedalaman || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 px-5 py-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">Lokasi Episentrum</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  <strong>Koordinat:</strong> {gempa.Lintang || "N/A"}, {gempa.Bujur || "N/A"}
                  <br />
                  <strong>Wilayah:</strong> {gempa.Wilayah || "N/A"}
                </p>
              </div>

              {gempa.Potensi && gempa.Potensi !== "-" && (
                <div className="rounded-2xl border border-slate-100 px-5 py-4">
                  <p className="mb-1 text-sm font-semibold text-slate-700">Potensi</p>
                  <p className="text-sm text-slate-600">{gempa.Potensi}</p>
                </div>
              )}

              {gempa.Dirasakan && gempa.Dirasakan !== "-" && (
                <div className="rounded-2xl border border-slate-100 px-5 py-4">
                  <p className="mb-1 text-sm font-semibold text-slate-700">Dirasakan</p>
                  <p className="text-sm text-slate-600">{gempa.Dirasakan}</p>
                </div>
              )}

              {gempa.Shakemap && (
                <div className="rounded-2xl border border-slate-100 px-5 py-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Peta Guncangan (Shakemap)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`}
                    alt="Shakemap Gempa"
                    className="w-full rounded-lg border border-slate-100 object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-2 text-center text-[0.85rem] text-slate-500">
          <p>Data dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</p>
          <p className="mt-1.5 text-xs text-slate-400">Terakhir diperbarui: {nowLabel} WITA</p>
        </footer>
      </div>
    </main>
  );
}