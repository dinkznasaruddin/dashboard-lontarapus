import { redirect } from "next/navigation";
import { requireAuth, hasMenuAccess } from "@/lib/auth";
import { MAKASSAR_MOVE_MODES, getEventsCached, getEvent } from "@/lib/makassar-move";
import { MakassarMoveEventManagement } from "@/components/makassar-move-event-management";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function EventManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string; jenis?: string; pesan?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const cfg = MAKASSAR_MOVE_MODES.production;
  if (session.role !== "superadmin" && !cfg.accessKeys.some((k) => hasMenuAccess(session, k))) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const action = (sp.action || "list") as "list" | "add" | "edit";
  const id = sp.id ?? null;
  const pesan = sp.pesan ?? null;
  const jenis = sp.jenis === "error" ? "error" : "success";
  const currentPage = Math.max(1, Number(sp.page) || 1);

  let editing = null;
  if (action === "edit" && id) {
    editing = await getEvent("production", id);
    if (!editing) redirect(cfg.basePath);
  }

  const allEvents = await getEventsCached("production");
  const totalEvents = allEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalEvents / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const slice = allEvents.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const startRow = totalEvents === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const endRow = Math.min(page * PER_PAGE, totalEvents);

  return (
    <MakassarMoveEventManagement
      mode="production"
      action={action}
      events={slice}
      editing={editing}
      totalEvents={totalEvents}
      totalPages={totalPages}
      currentPage={page}
      startRow={startRow}
      endRow={endRow}
      flash={pesan ? { jenis, pesan } : null}
    />
  );
}