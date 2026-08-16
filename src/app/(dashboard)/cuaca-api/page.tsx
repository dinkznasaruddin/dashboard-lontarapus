import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { RemoteImage } from "@/components/remote-image";
import { CuacaSkeleton } from "@/components/skeleton";
import { ShakemapBlock } from "@/components/shakemap-block";
import { getCuaca, type CuacaItem } from "@/lib/cuaca";
import {
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
  MapPin,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

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

/** Prakiraan 24 jam (8 entri pertama setelah entri sekarang). */
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

function fmtWaktu(v?: string): string {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  } catch {
    return v;
  }
}

export default async function CuacaApiPage() {
  await requireAuth();
  return (
    <Suspense fallback={<CuacaSkeleton />}>
      <CuacaContent />
    </Suspense>
  );
}

async function CuacaContent() {
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
    <div>
      <PageHeader
        title="Layanan Cuaca"
        subtitle="Prakiraan cuaca, peringatan dini, dan info gempa dari BMKG"
        action={
          <a
            href="/cuaca-api"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </a>
        }
      />

      {/* Header lokasi */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-[#B21D28]" />
          <span className="font-medium">{lokasiLabel}</span>
          <span className="text-slate-300">•</span>
          <span>
            Terakhir diperbarui: {nowLabel} WITA
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prakiraan Cuaca */}
        <Card className="lg:col-span-2">
          <CardHeader title="Prakiraan Cuaca" />
          <CardBody>
            {!current ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Data prakiraan cuaca tidak tersedia saat ini.
              </p>
            ) : (
              <>
                <div className="border-b border-slate-200 pb-6 text-center">
                  <WeatherIconBmkg
                    image={current.image}
                    desc={current.weather_desc}
                    className="mx-auto h-20 w-20"
                  />
                  <p className="mt-2 text-base text-slate-500">
                    Saat ini {current.weather_desc || "N/A"}
                  </p>
                  <p className="text-6xl font-bold text-[#B21D28]">{current.t ?? "N/A"}°C</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center">
                    <Droplets className="h-6 w-6 text-[#B21D28]" />
                    <p className="text-lg font-semibold text-slate-800">{current.hu ?? "N/A"}%</p>
                    <p className="text-xs text-slate-400">Kelembapan</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center">
                    <Wind className="h-6 w-6 text-[#B21D28]" />
                    <p className="text-lg font-semibold text-slate-800">{current.ws ?? "N/A"} km/jam</p>
                    <p className="text-xs text-slate-400">Kec. Angin</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center">
                    <Compass className="h-6 w-6 text-[#B21D28]" />
                    <p className="text-lg font-semibold text-slate-800">
                      {current.wd ?? "N/A"} ({current.wd_deg ?? "N/A"}°)
                    </p>
                    <p className="text-xs text-slate-400">Arah Angin</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">Prakiraan 24 Jam</h3>
                  <div className="space-y-2">
                    {forecast.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-2.5"
                      >
                        <span className="w-14 text-sm font-semibold text-slate-700">
                          {timeOf(f.local_datetime)}
                        </span>
                        <span className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-600">
                          <WeatherIconBmkg image={f.image} desc={f.weather_desc} className="h-5 w-5" />
                          {f.weather_desc || "N/A"}
                        </span>
                        <span className="w-14 text-right text-sm font-bold text-[#B21D28]">
                          {f.t ?? "N/A"}°C
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Peringatan Dini */}
        <Card>
          <CardHeader title="Peringatan Dini Cuaca" />
          <CardBody>
            {!warning?.headline ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-[#B21D28]" />
                <p className="mt-3 text-sm text-slate-600">
                  Tidak ada peringatan cuaca saat ini.
                  <br />
                  Kondisi cuaca dalam keadaan normal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border-l-4 border-[#B21D28] bg-red-50/60 px-4 py-3.5">
                  <p className="text-sm font-semibold text-slate-800">{warning.headline}</p>
                  {warning.area && (
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>Wilayah:</strong> {warning.area}
                    </p>
                  )}
                </div>
                {warning.description && (
                  <div className="rounded-xl border border-slate-100 px-4 py-3.5">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Deskripsi:</p>
                    <p className="whitespace-pre-line text-sm text-slate-600">{warning.description}</p>
                  </div>
                )}
                {warning.instruction && (
                  <div className="rounded-xl border border-slate-100 px-4 py-3.5">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Instruksi:</p>
                    <p className="whitespace-pre-line text-sm text-slate-600">{warning.instruction}</p>
                  </div>
                )}
                {warning.web && (
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <RemoteImage
                      src={warning.web}
                      alt="Infografis Peringatan Cuaca"
                      className="w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Info Gempa */}
        <Card>
          <CardHeader title="Info Gempa Wilayah di Indonesia" />
          <CardBody>
            {!gempa?.Magnitude ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-[#B21D28]" />
                <p className="mt-3 text-sm text-slate-600">Data gempa terkini tidak tersedia saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 px-4 py-5">
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] border-[#B21D28]/30 bg-red-50">
                      <span className="text-3xl font-bold leading-none text-[#B21D28]">
                        {gempa.Magnitude}
                      </span>
                      <span className="mt-1 text-xs text-slate-400">SR</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#B21D28]" />
                        {gempa.Tanggal || "N/A"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#B21D28]" />
                        {gempa.Jam || "N/A"} WITA
                      </p>
                      <p className="flex items-center gap-2">
                        <ArrowDownUp className="h-4 w-4 text-[#B21D28]" />
                        Kedalaman: {gempa.Kedalaman || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 px-4 py-3.5">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Lokasi Episentrum</p>
                  <p className="text-sm text-slate-600">
                    <strong>Koordinat:</strong> {gempa.Lintang || "N/A"}, {gempa.Bujur || "N/A"}
                    <br />
                    <strong>Wilayah:</strong> {gempa.Wilayah || "N/A"}
                  </p>
                </div>

                {gempa.Potensi && gempa.Potensi !== "-" && (
                  <div className="rounded-xl border border-slate-100 px-4 py-3.5">
                    <p className="mb-1 text-sm font-semibold text-slate-700">Potensi</p>
                    <p className="text-sm text-slate-600">{gempa.Potensi}</p>
                  </div>
                )}

                {gempa.Dirasakan && gempa.Dirasakan !== "-" && (
                  <div className="rounded-xl border border-slate-100 px-4 py-3.5">
                    <p className="mb-1 text-sm font-semibold text-slate-700">Dirasakan</p>
                    <p className="text-sm text-slate-600">{gempa.Dirasakan}</p>
                  </div>
                )}

                {gempa.Shakemap && (
                  <ShakemapBlock src={`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`} />
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Data dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) — {fmtWaktu(gempa?.DateTime)}
      </p>
    </div>
  );
}