import { redirect } from "next/navigation";
import { requireAuth, hasMenuAccess } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import { EventMap } from "@/components/event-map";
import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { addEvent, editEvent, deleteEvent } from "./actions";

interface EventRow {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string;
  tgl_event: string;
  tempat: string;
  organizer: string | null;
  latitude: string;
  longitude: string;
  status: number;
}

const STATUS_META: Record<number, { label: string; color: "blue" | "green" | "slate" | "gray" }> = {
  1: { label: "Akan Datang", color: "blue" },
  2: { label: "Sedang Berlangsung", color: "green" },
  3: { label: "Selesai", color: "slate" },
};

/** Konversi tanggal database (dd-mm-yyyy) ke format date input (yyyy-mm-dd). */
function toInputDate(dbDate: string): string {
  const parts = dbDate.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

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

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string; jenis?: string; pesan?: string; page?: string }>;
}) {
  const session = await requireAuth();
  if (!hasMenuAccess(session, "event")) redirect("/dashboard");

  const sp = await searchParams;
  const action = sp.action || "list";
  const id = sp.id ? Number(sp.id) : null;
  const pesan = sp.pesan ?? null;
  const jenis = sp.jenis ?? "success";

  let events: EventRow[] = [];
  let editing: EventRow | null = null;
  let totalEvents = 0;
  let totalPages = 1;
  let currentPage = Math.max(1, Number(sp.page) || 1);

  if (action === "edit" && id) {
    const rows = await query<EventRow>("SELECT * FROM tb_event WHERE id = ?", [id]);
    editing = rows[0] ?? null;
    if (!editing) redirect("/master-data/event");
  }

  if (action === "list") {
    const [countRow] = await query<{ total: number }>("SELECT COUNT(*) AS total FROM tb_event");
    totalEvents = countRow.total;
    totalPages = Math.max(1, Math.ceil(totalEvents / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);
    const offset = (currentPage - 1) * PER_PAGE;
    events = await query<EventRow>(
      "SELECT id, judul, gambar, tgl_event, tempat, status FROM tb_event ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [PER_PAGE, offset]
    );
  }

  const isEdit = action === "edit";
  const startRow = totalEvents === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endRow = Math.min(currentPage * PER_PAGE, totalEvents);

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Event" : "Manajemen Event"}
        subtitle={isEdit ? "Perbarui data event" : "Daftar semua event yang tersimpan di database."}
        action={
          !isEdit ? (
            <Link
              href="/master-data/event?action=add"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Event Baru
            </Link>
          ) : (
            <Link
              href="/master-data/event"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← Kembali
            </Link>
          )
        }
      />

      {pesan && (
        <div
          className={
            jenis === "error"
              ? "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          }
        >
          {pesan}
        </div>
      )}

      {isEdit || action === "add" ? (
        <Card className="max-w-3xl">
          <CardBody>
            <form
              action={isEdit ? editEvent.bind(null, id!) : addEvent}
              className="space-y-4"
            >
              <input type="hidden" name="gambar_lama" value={editing?.gambar ?? ""} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                <input
                  name="judul"
                  required
                  defaultValue={editing?.judul ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea
                  name="deskripsi"
                  rows={5}
                  defaultValue={editing?.deskripsi ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Event</label>
                <input
                  type="file"
                  name="gambar"
                  accept="image/jpeg,image/png"
                  required={!isEdit}
                  className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                <small className="mt-1 block text-xs text-slate-400">
                  Resolusi disarankan 1400x800 px (rasio 16:9). Format JPG/PNG maksimal 2MB.
                </small>
                {editing?.gambar ? (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.gambar}
                      alt="Gambar saat ini"
                      className="max-w-[300px] rounded border border-slate-200 p-1"
                    />
                    <small className="mt-1 block text-xs text-slate-400">
                      Biarkan kosong jika tidak ingin mengubah gambar.
                    </small>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Event</label>
                  <input
                    type="date"
                    name="tgl_event"
                    defaultValue={editing ? toInputDate(editing.tgl_event) : ""}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    name="status"
                    defaultValue={editing?.status ?? 1}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="1">Akan Datang</option>
                    <option value="2">Sedang Berlangsung</option>
                    <option value="3">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tempat</label>
                <input
                  name="tempat"
                  required
                  defaultValue={editing?.tempat ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Organizer</label>
                <input
                  name="organizer"
                  defaultValue={editing?.organizer ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pilih Lokasi di Peta (atau isi manual)
                </label>
                <EventMap lat={editing?.latitude ?? ""} lng={editing?.longitude ?? ""} />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Simpan
                </button>
                <Link
                  href="/master-data/event"
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
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Judul</th>
                    <th className="px-5 py-3">Gambar</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Tempat</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((e) => {
                    const meta = STATUS_META[e.status] ?? { label: "Tidak Diketahui", color: "gray" as const };
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">{e.id}</td>
                        <td className="max-w-[260px] px-5 py-3 font-medium text-slate-700">
                          <span className="line-clamp-2">{e.judul}</span>
                        </td>
                        <td className="px-5 py-3">
                          {e.gambar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.gambar} alt={e.judul} width={100} className="rounded border border-slate-100" />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">{e.tgl_event}</td>
                        <td className="max-w-[220px] px-5 py-3 text-slate-600">
                          <span className="line-clamp-2">{e.tempat}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Badge color={meta.color}>{meta.label}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={`/master-data/event?action=edit&id=${e.id}`}
                              className="rounded-md p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </a>
                            <DeleteButton
                              action={deleteEvent.bind(null, e.id, currentPage)}
                              confirmText={`Apakah Anda yakin ingin menghapus event "${e.judul}"?`}
                              title="Hapus"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
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
                    href={currentPage > 1 ? `/master-data/event?page=${currentPage - 1}` : "#"}
                    aria-disabled={currentPage <= 1}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      currentPage > 1
                        ? "text-slate-600 hover:bg-slate-100"
                        : "pointer-events-none text-slate-300"
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
                        href={`/master-data/event?page=${p}`}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          p === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </a>
                    )
                  )}
                  <a
                    href={currentPage < totalPages ? `/master-data/event?page=${currentPage + 1}` : "#"}
                    aria-disabled={currentPage >= totalPages}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      currentPage < totalPages
                        ? "text-slate-600 hover:bg-slate-100"
                        : "pointer-events-none text-slate-300"
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
