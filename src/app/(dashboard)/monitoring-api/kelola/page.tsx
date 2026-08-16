import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import { CopyButton } from "@/components/copy-button";
import { Plus, Pencil, HeartPulse } from "lucide-react";
import Link from "next/link";
import { addApi, editApi, deleteApi } from "./actions";

interface ApiRow {
  id: number;
  api_name: string;
  end_poin: string;
  methods: string;
  status: string;
  opd: string;
}

export const dynamic = "force-dynamic";

export default async function KelolaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string }>;
}) {
  const session = await requireAuth();
  if (session.role !== "superadmin") redirect("/monitoring-api");

  const sp = await searchParams;
  const action = sp.action || "list";
  const id = sp.id ? Number(sp.id) : null;

  const apis = await query<ApiRow>(
    "SELECT id, api_name, end_poin, methods, status, opd FROM tb_api ORDER BY id"
  );

  let editing: ApiRow | null = null;
  if (action === "edit" && id) {
    editing = apis.find((a) => a.id === id) ?? null;
  }

  if (action !== "list") {
    return (
      <div>
        <PageHeader
          title={action === "add" ? "Tambah API Baru" : "Edit API"}
          action={
            <Link href="/monitoring-api/kelola" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              ← Kembali
            </Link>
          }
        />
        <Card className="max-w-xl">
          <CardBody>
            <form action={action === "add" ? addApi : editApi.bind(null, id!)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama API</label>
                <input
                  name="api_name"
                  required
                  defaultValue={editing?.api_name ?? ""}
                  placeholder="Contoh: API Aduan Makassar"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">End Point</label>
                <input
                  name="end_poin"
                  required
                  defaultValue={editing?.end_poin ?? ""}
                  placeholder="https://contoh.go.id/api/endpoint"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Methods</label>
                  <select name="methods" defaultValue={editing?.methods ?? "GET"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                    {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select name="status" defaultValue={editing?.status ?? "online"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">OPD</label>
                <input
                  name="opd"
                  defaultValue={editing?.opd ?? ""}
                  placeholder="Dinas/Instansi terkait"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Simpan
                </button>
                <Link href="/monitoring-api/kelola" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
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
        title="Kelola Data API"
        subtitle="Tambah, ubah, dan hapus API di tabel tb_api"
        action={
          <div className="flex items-center gap-2">
            <Link href="/monitoring-api" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <HeartPulse className="h-4 w-4" />
              Monitoring
            </Link>
            <a
              href="/monitoring-api/kelola?action=add"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah API
            </a>
          </div>
        }
      />

      <Card>
        <CardHeader title="Daftar API Integration Lontara+" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">Nama API</th>
                  <th className="px-5 py-3">End Point</th>
                  <th className="px-5 py-3">Methods</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">OPD</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apis.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{a.api_name}</td>
                    <td className="max-w-[280px] px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs text-slate-500">{a.end_poin}</span>
                        <CopyButton text={a.end_poin} title="Salin" />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">{a.methods}</td>
                    <td className="px-5 py-3">
                      <Badge color={a.status === "online" ? "green" : "red"}>
                        {a.status === "online" ? "Online" : "Offline"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{a.opd || "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`/monitoring-api/kelola?action=edit&id=${a.id}`}
                          className="rounded-md p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </a>
                        <DeleteButton
                          action={deleteApi.bind(null, a.id)}
                          confirmText="Yakin ingin menghapus API ini?"
                          title="Hapus"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {apis.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data API.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}