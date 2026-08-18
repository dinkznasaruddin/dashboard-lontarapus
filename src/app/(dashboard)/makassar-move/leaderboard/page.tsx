import { redirect } from "next/navigation";
import { requireAuth, hasMenuAccess } from "@/lib/auth";
import { MAKASSAR_MOVE_MODES, getEventsCached, getLeaderboard } from "@/lib/makassar-move";
import { MakassarMoveLeaderboard } from "@/components/makassar-move-leaderboard";

export const dynamic = "force-dynamic";

const PER_PAGE = 15;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const sp = await searchParams;

  const cfg = MAKASSAR_MOVE_MODES.production;
  if (session.role !== "superadmin" && !cfg.accessKeys.some((k) => hasMenuAccess(session, k))) {
    redirect("/dashboard");
  }

  const allEvents = await getEventsCached("production");
  const selectedEventId = sp.event ?? allEvents[0]?.eventId ?? null;
  const selectedEvent = selectedEventId ? allEvents.find((e) => e.eventId === selectedEventId) ?? null : null;

  let leaderboard = null;
  if (selectedEventId) {
    leaderboard = await getLeaderboard("production", selectedEventId);
  }

  const currentPage = Math.max(1, Number(sp.page) || 1);
  const entries = leaderboard?.leaderboard ?? [];
  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const startRow = entries.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const endRow = Math.min(page * PER_PAGE, entries.length);

  return (
    <MakassarMoveLeaderboard
      events={allEvents}
      selectedEvent={selectedEvent}
      leaderboard={leaderboard}
      pageEntries={pageEntries}
      currentPage={page}
      totalPages={totalPages}
      startRow={startRow}
      endRow={endRow}
    />
  );
}