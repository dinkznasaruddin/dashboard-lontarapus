import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { MENU_GROUPS } from "@/lib/menu-groups";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import { ToggleAllMenus } from "@/components/toggle-all-menus";
import { Plus, Pencil, FolderOpen, Eye } from "lucide-react";
import Link from "next/link";
import { addAkun, editAkun, deleteAkun } from "./actions";

interface UserRow {
  id: number;
  nama: string;
  skpd: string;
  username: string;
  role: string;
  menu_access: string | null;
  login_count: number;
  last_login: string | Date | null;
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

function roleBadge(role: string) {
  if (role === "superadmin") return <Badge color="red">Superadmin</Badge>;
  if (role === "SKPD") return <Badge color="blue">SKPD</Badge>;
  return <Badge color="gray">{role}</Badge>;
}

/** Format last_login relatif seperti sistem lama. */
function formatLastLogin(d: string | Date | null) {
  if (!d) return <span className="text-slate-400">Belum pernah login</span>;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(+date)) return String(d);

  const diff = Date.now() - +date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 86400000) {
    if (hours < 1) {
      return <span className="text-emerald-600">{Math.max(0, minutes)} menit yang lalu</span>;
    }
    return <span className="text-emerald-600">{hours} jam yang lalu</span>;
  }
  if (days < 7) {
    return <span className="text-blue-600">{days} hari yang lalu</span>;
  }
  return (
    <span className="text-slate-500">
      {date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}
    </span>
  );
}

function parseMenu(menuAccess: string | null): string[] {
  try {
    const arr = JSON.parse(menuAccess || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string; jenis?: string; pesan?: string; page?: string }>;
}) {
  const session = await requireAuth();
  if (session.role !== "superadmin") redirect("/dashboard");

  const sp = await searchParams;
  const action = sp.action || "list";
  const id = sp.id ? Number(sp.id) : null;
  const pesan = sp.pesan ?? null;
  const jenis = sp.jenis ?? "success";

  let totalUsers = 0;
  let totalPages = 1;
  let currentPage = Math.max(1, Number(sp.page) || 1);
  const isForm = action === "add" || action === "edit";

  let users: UserRow[] = [];
  if (!isForm) {
    const [countRow] = await query<{ total: number }>("SELECT COUNT(*) AS total FROM tb_user_admin");
    totalUsers = countRow.total;
    totalPages = Math.max(1, Math.ceil(totalUsers / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);
    users = await query<UserRow>(
      "SELECT id, nama, skpd, username, role, menu_access, login_count, last_login FROM tb_user_admin ORDER BY id DESC LIMIT ? OFFSET ?",
      [PER_PAGE, (currentPage - 1) * PER_PAGE]
    );
  }

  const startRow = totalUsers === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endRow = Math.min(currentPage * PER_PAGE, totalUsers);

  let editing: (UserRow & { menuArray: string[] }) | null = null;
  if (action === "edit" && id) {
    const rows = await query<UserRow>(
      "SELECT id, nama, skpd, username, role, menu_access, login_count, last_login FROM tb_user_admin WHERE id = ? LIMIT 1",
      [id]
    );
    const u = rows[0] ?? null;
    if (u) {
      editing = { ...u, menuArray: parseMenu(u.menu_access) };
    }
  }

  const isEdit = action === "edit";

  if (action === "add" || isEdit) {
    return (
      <div>
        <PageHeader
          title={isEdit ? "Edit Akun" : "Tambah Akun Baru"}
          action={
            <Link
              href="/akun"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← Kembali
            </Link>
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

        <Card className="max-w-3xl">
          <CardBody>
            <form action={isEdit ? editAkun.bind(null, id!) : addAkun} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
                  <input name="nama" required defaultValue={editing?.nama ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">SKPD</label>
                  <input name="skpd" defaultValue={editing?.skpd ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input name="username" required defaultValue={editing?.username ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Password {isEdit && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                  </label>
                  <input name="password" type="password" required={!isEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                  <input name="password_confi" type="password" required={!isEdit} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select name="role" defaultValue={editing?.role ?? "SKPD"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="SKPD">SKPD</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>Akses Menu</span>
                  <ToggleAllMenus />
                </label>
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 p-4">
                  {MENU_GROUPS.map((group) => (
                    <div key={group.name} className="mb-4">
                      <h6 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-blue-700">
                        <FolderOpen className="h-4 w-4" />
                        {group.name}
                      </h6>
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((m) => {
                          const isSub = m.label.startsWith("└─");
                          return (
                            <label
                              key={m.key}
                              className={`flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 ${isSub ? "pl-5" : ""}`}
                              style={isSub ? { fontSize: "0.875rem" } : undefined}
                            >
                              <input
                                type="checkbox"
                                className="menu-checkbox h-4 w-4 rounded border-slate-300 text-blue-600"
                                name="menu_access[]"
                                value={m.key}
                                defaultChecked={editing?.menuArray.includes(m.key) ?? false}
                              />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Centang menu yang dapat diakses oleh akun ini. Superadmin otomatis punya akses penuh ke semua menu.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Simpan Perubahan
                </button>
                <Link href="/akun" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  Batal
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Manajemen Akun"
        subtitle="Daftar semua akun admin yang terdaftar."
        action={
          <Link
            href="/akun?action=add"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Akun Baru
          </Link>
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

      <Card>
        <CardHeader title={`Daftar Akun (${totalUsers.toLocaleString("id-ID")})`} />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3">SKPD</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Menu Access</th>
                  <th className="px-5 py-3">Total Login</th>
                  <th className="px-5 py-3">Login Terakhir</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const menuArray = parseMenu(u.menu_access);
                  const menuCount = menuArray.length;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">{u.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{u.nama}</td>
                      <td className="px-5 py-3">{u.skpd || "-"}</td>
                      <td className="px-5 py-3 font-mono text-xs">{u.username}</td>
                      <td className="px-5 py-3">{roleBadge(u.role)}</td>
                      <td className="px-5 py-3">
                        <Badge color="blue">{menuCount} menu</Badge>
                        {menuCount > 0 && (
                          <details className="group mt-1">
                            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                              <Eye className="h-3.5 w-3.5" />
                              Lihat menu
                            </summary>
                            <div
                              className="mt-1 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs text-slate-600"
                              title={menuArray.join(", ")}
                            >
                              {menuArray.join(", ")}
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {u.login_count}x
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">{formatLastLogin(u.last_login)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <a href={`/akun?action=edit&id=${u.id}`} className="rounded-md p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </a>
                          <DeleteButton
                            action={deleteAkun.bind(null, u.id, currentPage)}
                            confirmText={`Apakah Anda yakin ingin menghapus akun ini?`}
                            title="Hapus"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              Menampilkan <strong>{startRow.toLocaleString("id-ID")}</strong>–
              <strong>{endRow.toLocaleString("id-ID")}</strong> dari{" "}
              <strong>{totalUsers.toLocaleString("id-ID")}</strong> akun
            </p>
            <nav className="flex items-center gap-1">
              <a
                href={currentPage > 1 ? `/akun?page=${currentPage - 1}` : "#"}
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
                    href={`/akun?page=${p}`}
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
                href={currentPage < totalPages ? `/akun?page=${currentPage + 1}` : "#"}
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
    </div>
  );
}
