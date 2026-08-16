import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import {
  MAKASSAR_MOVE_MODES,
  EVENT_STATUS_META,
  ADUAN_STATUS_META,
  type MakassarMoveMode,
  type MmEvent,
} from "@/lib/makassar-move";
import { createEvent, updateEvent, deleteEvent } from "@/lib/makassar-move-actions";

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

function toLocalInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function CheckRow({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="h-4 w-4 rounded border-slate-300 text-blue-600"
      />
      {label}
    </label>
  );
}

function AduanStatusBadges(statuses: string[] | undefined) {
  const arr = Array.isArray(statuses) ? statuses : statuses ? [statuses] : ["open"];
  return (
    <div className="flex flex-wrap gap-1">
      {arr.map((s) => {
        const meta = ADUAN_STATUS_META[s.toLowerCase()] ?? { label: s, color: "gray" as const };
        return <Badge key={s} color={meta.color}>{meta.label}</Badge>;
      })}
    </div>
  );
}

export function MakassarMoveEventManagement({
  mode,
  action,
  events,
  editing,
  totalEvents,
  totalPages,
  currentPage,
  startRow,
  endRow,
  flash,
}: {
  mode: MakassarMoveMode;
  action: "list" | "add" | "edit";
  events: MmEvent[];
  editing: MmEvent | null;
  totalEvents: number;
  totalPages: number;
  currentPage: number;
  startRow: number;
  endRow: number;
  flash: { jenis: "success" | "error"; pesan: string } | null;
}) {
  const cfg = MAKASSAR_MOVE_MODES[mode];
  const base = cfg.basePath;
  const isForm = action === "add" || action === "edit";
  const eventStatus = editing?.status ?? "akan_datang";
  const catArr = Array.isArray(editing?.category)
    ? (editing!.category as string[])
    : editing?.category
      ? [editing!.category]
      : ["Lari"];
  const aduanArr = Array.isArray(editing?.aduan_status)
    ? (editing!.aduan_status as string[])
    : editing?.aduan_status
      ? [editing!.aduan_status]
      : ["open"];

  return (
    <div>
      <PageHeader
        title={action === "edit" ? `Edit Event: ${editing?.eventId ?? ""}` : action === "add" ? "Tambah Event Baru" : cfg.title}
        subtitle={action === "list" ? cfg.subtitle : "Lengkapi detail event di bawah ini."}
        action={
          !isForm ? (
            <Link
              href={`${base}?action=add`}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Event Baru
            </Link>
          ) : (
            <Link
              href={base}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← Kembali
            </Link>
          )
        }
      />

      {flash && (
        <div
          className={
            flash.jenis === "error"
              ? "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          }
        >
          {flash.pesan}
        </div>
      )}

      {isForm ? (
        <Card className="max-w-3xl">
          <CardBody>
            <form
              action={
                action === "edit"
                  ? updateEvent.bind(null, mode, editing!.eventId)
                  : createEvent.bind(null, mode)
              }
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Judul Event</label>
                <input
                  name="title"
                  required
                  defaultValue={editing?.title ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={editing?.description ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  URL Gambar Banner (opsional)
                </label>
                <input
                  type="url"
                  name="image_url"
                  defaultValue={editing?.image_url ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <small className="mt-1 block text-xs text-slate-400">
                  Kosongkan untuk mempertahankan banner saat ini (API tidak mendukung menghapus gambar).
                </small>
                {editing?.image_url ? (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.image_url}
                      alt="Banner saat ini"
                      className="max-h-[180px] rounded border border-slate-200 p-1"
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Mulai</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    required
                    defaultValue={editing ? toLocalInput(editing.start_date) : ""}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Selesai</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    required
                    defaultValue={editing ? toLocalInput(editing.end_date) : ""}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi (opsional)</label>
                <input
                  name="location"
                  defaultValue={editing?.location ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {["Lari", "Sepeda", "Jalan"].map((c) => (
                      <CheckRow
                        key={c}
                        name="category"
                        value={c}
                        label={c}
                        checked={catArr.includes(c)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max Peserta</label>
                  <input
                    type="number"
                    name="max_participants"
                    min={1}
                    defaultValue={editing?.max_participants ?? 1000}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status Event</label>
                  <select
                    name="status"
                    defaultValue={eventStatus}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="akan_datang">Akan Datang</option>
                    <option value="berlangsung">Berlangsung</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Filter Aduan (multi)</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  {[
                    ["open", "Open"],
                    ["in progress", "In Progress"],
                    ["answered", "Answered"],
                    ["on hold", "On Hold"],
                    ["closed", "Closed"],
                  ].map(([v, l]) => (
                    <CheckRow
                      key={v}
                      name="aduan_status"
                      value={v}
                      label={l}
                      checked={aduanArr.includes(v)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Skor Aduan</label>
                  <input
                    type="number"
                    name="aduan_score"
                    min={0}
                    defaultValue={editing?.aduan_score ?? 0}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Skor Jarak</label>
                  <input
                    type="number"
                    name="distance_score"
                    min={0}
                    defaultValue={editing?.distance_score ?? 0}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {action === "edit" ? "Update Event" : "Simpan Event"}
                </button>
                <Link
                  href={base}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title={`Daftar Event (${totalEvents.toLocaleString("id-ID")})`} />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Event ID</th>
                    <th className="px-5 py-3">Judul</th>
                    <th className="px-5 py-3">Tanggal Mulai</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Peserta</th>
                    <th className="px-5 py-3">Status Event</th>
                    <th className="px-5 py-3">Filter Aduan</th>
                    <th className="px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((e) => {
                    const st = EVENT_STATUS_META[e.status] ?? { label: e.status, color: "gray" as const };
                    const cat = Array.isArray(e.category) ? e.category.join(", ") : e.category ?? "";
                    return (
                      <tr key={e.eventId} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">{e.eventId}</td>
                        <td className="max-w-[240px] px-5 py-3 font-medium text-slate-700">
                          <span className="line-clamp-2">{e.title}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                          {new Date(e.start_date).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="max-w-[160px] px-5 py-3 text-xs text-slate-600">{cat}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs">
                          {e.current_participants ?? 0}/{e.max_participants ?? "~"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge color={st.color}>{st.label}</Badge>
                        </td>
                        <td className="px-5 py-3">{AduanStatusBadges(e.aduan_status)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={`${base}?action=edit&id=${encodeURIComponent(e.eventId)}`}
                              className="rounded-md p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </a>
                            <DeleteButton
                              action={deleteEvent.bind(null, mode, e.eventId, currentPage)}
                              confirmText={`Apakah Anda yakin ingin menghapus event "${e.title}"?`}
                              title="Hapus"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                        Belum ada event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Menampilkan <strong>{startRow.toLocaleString("id-ID")}</strong>–
                <strong>{endRow.toLocaleString("id-ID")}</strong> dari{" "}
                <strong>{totalEvents.toLocaleString("id-ID")}</strong> event
              </p>
              <nav className="flex items-center gap-1">
                <a
                  href={currentPage > 1 ? `${base}?page=${currentPage - 1}` : "#"}
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
                      href={`${base}?page=${p}`}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        p === currentPage ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </a>
                  )
                )}
                <a
                  href={currentPage < totalPages ? `${base}?page=${currentPage + 1}` : "#"}
                  aria-disabled={currentPage >= totalPages}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    currentPage < totalPages ? "text-slate-600 hover:bg-slate-100" : "pointer-events-none text-slate-300"
                  }`}
                >
                  Next »
                </a>
              </nav>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}