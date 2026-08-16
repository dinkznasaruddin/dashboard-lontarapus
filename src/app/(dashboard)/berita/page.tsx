import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { fetchNews, extractListPayload } from "@/lib/apis";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/card";
import { BeritaSkeleton } from "@/components/skeleton";

interface NewsItem {
  judul?: string;
  title?: string;
  kategori?: string;
  category?: string;
  gambar?: string;
  image?: string;
  url_image?: string;
  created_at?: string;
  tanggal?: string;
  date?: string;
  isi?: string;
  content?: string;
}

const BERITA_MIN_YEAR = 2025;
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

function fmtDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/* Berita di-cache agar payload API (jauh >2MB, tak bisa pakai fetch-cache)
   tidak di-download ulang di setiap request. Data hanya 2025 ke atas. */
const loadNews = unstable_cache(
  async () => {
    try {
      const raw = await fetchNews<any>(600);
      const items = extractListPayload<NewsItem>(raw);
      return items
        .filter((b) => {
          const d = new Date(b.created_at || b.tanggal || b.date || "");
          return !isNaN(+d) && d.getFullYear() >= BERITA_MIN_YEAR;
        })
        .map((b) => ({
          judul: b.judul || b.title || "-",
          kategori: b.kategori || b.category || "-",
          tanggal: b.created_at || b.tanggal || b.date,
        }));
    } catch {
      return [];
    }
  },
  ["berita-list"],
  { revalidate: 600 }
);

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  return (
    <Suspense fallback={<BeritaSkeleton />}>
      <BeritaContent pageParam={sp.page} />
    </Suspense>
  );
}

async function BeritaContent({ pageParam }: { pageParam?: string }) {
  const allItems = await loadNews();

  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const startRow = totalItems === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endRow = Math.min(currentPage * PER_PAGE, totalItems);
  const items = allItems.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div>
      <PageHeader title="Berita" subtitle="Data berita dari api.makassarkota.go.id (tahun 2025 ke atas)" />

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Daftar Berita"
            subtitle={`Menampilkan ${startRow.toLocaleString("id-ID")}–${endRow.toLocaleString("id-ID")} dari ${totalItems.toLocaleString("id-ID")} berita`}
          />
          <CardBody>
            {totalItems === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Gagal mengambil data berita.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-5 py-3">No</th>
                        <th className="px-5 py-3">Judul</th>
                        <th className="px-5 py-3">Kategori</th>
                        <th className="px-5 py-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((b, i) => (
                        <tr key={startRow + i} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-400">{(startRow + i).toLocaleString("id-ID")}</td>
                          <td className="max-w-[420px] px-5 py-3 font-medium text-slate-700">
                            <span className="line-clamp-2">{b.judul}</span>
                          </td>
                          <td className="px-5 py-3">{b.kategori}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">{fmtDate(b.tanggal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
                  <p className="text-xs text-slate-500">
                    Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                  </p>
                  <nav className="flex items-center gap-1">
                    <a
                      href={currentPage > 1 ? `/berita?page=${currentPage - 1}` : "#"}
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
                          href={`/berita?page=${p}`}
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
                      href={currentPage < totalPages ? `/berita?page=${currentPage + 1}` : "#"}
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
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
