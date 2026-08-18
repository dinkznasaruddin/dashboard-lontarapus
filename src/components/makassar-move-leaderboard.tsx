import Link from "next/link";
import { Trophy, Medal, MapPin, Timer, Route } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import {
  EVENT_STATUS_META,
  type MmEvent,
  type MmLeaderboard,
  type MmLeaderboardEntry,
} from "@/lib/makassar-move";
import { cn } from "@/lib/utils";

const MEDAL_COLORS = ["bg-yellow-100 text-yellow-700 ring-yellow-200", "bg-slate-200 text-slate-700 ring-slate-300", "bg-amber-100 text-amber-700 ring-amber-200"];

function fmtKm(v: number): string {
  return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("...");
    out.push(p);
    prev = p;
  }
  return out;
}

export function MakassarMoveLeaderboard({
  events,
  selectedEvent,
  leaderboard,
  pageEntries,
  currentPage,
  totalPages,
  startRow,
  endRow,
}: {
  events: MmEvent[];
  selectedEvent: MmEvent | null;
  leaderboard: MmLeaderboard | null;
  pageEntries: MmLeaderboardEntry[];
  currentPage: number;
  totalPages: number;
  startRow: number;
  endRow: number;
}) {
  const entries = leaderboard?.leaderboard ?? [];
  const st = selectedEvent ? (EVENT_STATUS_META[selectedEvent.status] ?? { label: selectedEvent.status, color: "gray" as const }) : null;
  const pageQuery = (page: number) => `?event=${encodeURIComponent(selectedEvent?.eventId ?? "")}&page=${page}`;

  return (
    <div>
      <PageHeader
        title="Leaderboard Makassar Move"
        subtitle="Peringkat peserta berdasarkan poin total (jarak + aduan)."
      />

      {/* Filter event */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2" method="GET">
          <span className="text-sm font-medium text-slate-600">Event</span>
          <select
            name="event"
            defaultValue={selectedEvent?.eventId ?? ""}
            className="max-w-[320px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">— Pilih Event —</option>
            {events.map((e) => (
              <option key={e.eventId} value={e.eventId}>
                {e.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Tampilkan
          </button>
        </form>
      </div>

      {selectedEvent ? (
        <>
          {/* Info event */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{selectedEvent.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    {new Date(selectedEvent.start_date).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {new Date(selectedEvent.end_date).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {selectedEvent.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedEvent.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Route className="h-3.5 w-3.5" />
                    {selectedEvent.current_participants ?? 0}/{selectedEvent.max_participants ?? "~"} peserta
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {st && <Badge color={st.color}>{st.label}</Badge>}
                <Badge color="blue">
                  <Trophy className="h-3 w-3" />
                  Poin: Jarak ×{leaderboard?.distance_score ?? selectedEvent.distance_score ?? 0} + Aduan ×{leaderboard?.aduan_score ?? selectedEvent.aduan_score ?? 0}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stat ringkas */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {entries.length > 0 && (
              <>
                {entries.slice(0, 3).map((e, i) => (
                  <div
                    key={e.user_id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset",
                          MEDAL_COLORS[i]
                        )}
                      >
                        <Medal className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{e.user_name}</p>
                        <p className="text-xs text-slate-500">No. {e.number_participant}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-blue-700">
                      {fmtKm(e.total_points)}
                      <span className="ml-1 text-xs font-medium text-slate-400">poin</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{fmtKm(e.total_distance_km)} km</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Tabel leaderboard */}
          <Card>
            <CardHeader
              title={`Peringkat Peserta (${entries.length})`}
              action={<Badge color="slate">Total poin {fmtKm(entries.reduce((a, e) => a + (e.total_points || 0), 0))}</Badge>}
            />
            <CardBody>
              {entries.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Belum ada data leaderboard untuk event ini.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Rank</th>
                          <th className="px-5 py-3">Peserta</th>
                          <th className="px-5 py-3">No. Peserta</th>
                          <th className="px-5 py-3 text-right">Jarak (km)</th>
                          <th className="px-5 py-3 text-right">Poin Jarak</th>
                          <th className="px-5 py-3 text-right">Aduan</th>
                          <th className="px-5 py-3 text-right">Poin Aduan</th>
                          <th className="px-5 py-3 text-right">Total Poin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageEntries.map((e: MmLeaderboardEntry) => (
                          <tr
                            key={e.user_id}
                            className={cn("hover:bg-slate-50", e.is_current_user && "bg-blue-50/60")}
                          >
                            <td className="px-5 py-3">
                              {e.rank <= 3 ? (
                                <span
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset",
                                    MEDAL_COLORS[e.rank - 1]
                                  )}
                                >
                                  {e.rank}
                                </span>
                              ) : (
                                <span className="text-slate-500">{e.rank}</span>
                              )}
                            </td>
                            <td className="max-w-[240px] px-5 py-3">
                              <div className="flex items-center gap-2">
                                {e.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={e.avatar_url}
                                    alt={e.user_name}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                                    {e.user_name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-700">{e.user_name}</p>
                                  {e.club_name && <p className="truncate text-xs text-slate-400">{e.club_name}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">
                              {e.number_participant}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">{fmtKm(e.total_distance_km)}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{fmtKm(e.distance_points)}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{e.aduan_count ?? 0}</td>
                            <td className="px-5 py-3 text-right text-slate-600">{fmtKm(e.aduan_points)}</td>
                            <td className="px-5 py-3 text-right font-semibold text-blue-700">{fmtKm(e.total_points)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                    <p className="text-xs text-slate-500">
                      Menampilkan <strong>{startRow.toLocaleString("id-ID")}</strong>–
                      <strong>{endRow.toLocaleString("id-ID")}</strong> dari{" "}
                      <strong>{entries.length.toLocaleString("id-ID")}</strong> peserta
                    </p>
                    <nav className="flex items-center gap-1">
                      <a
                        href={currentPage > 1 ? pageQuery(currentPage - 1) : "#"}
                        aria-disabled={currentPage <= 1}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          currentPage > 1 ? "text-slate-600 hover:bg-slate-100" : "pointer-events-none text-slate-300"
                        }`}
                      >
                        « Prev
                      </a>
                      {pageRange(currentPage, totalPages).map((p, i) =>
                        p === "..." ? (
                          <span key={`e${i}`} className="px-2 py-1.5 text-sm text-slate-400">
                            …
                          </span>
                        ) : (
                          <a
                            key={p}
                            href={pageQuery(p)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                              p === currentPage ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </a>
                        )
                      )}
                      <a
                        href={currentPage < totalPages ? pageQuery(currentPage + 1) : "#"}
                        aria-disabled={currentPage >= totalPages}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          currentPage < totalPages ? "text-slate-600 hover:bg-slate-100" : "pointer-events-none text-slate-300"
                        }`}
                      >
                        Next »
                      </a>
                    </nav>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <CardBody>
            <p className="py-10 text-center text-sm text-slate-400">
              Silakan pilih event untuk melihat leaderboard.{" "}
              <Link href="/makassar-move/event-management" className="font-semibold text-blue-600 hover:underline">
                Kelola Event
              </Link>
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}