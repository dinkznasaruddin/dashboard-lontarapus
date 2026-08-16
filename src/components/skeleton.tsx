export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className ?? ""}`} />;
}

/** Skeleton generik untuk halaman lain (pakai loading.tsx). */
export function GenericPageSkeleton() {
  return (
    <div>
      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="mt-2 h-4 w-72" />
        </div>
        <SkeletonBlock className="h-9 w-32" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Filter/toolbar */}
      <div className="mt-5 flex items-center gap-3">
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-9 w-40" />
      </div>

      {/* Tabel */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-4 w-44" />
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-3">
            <SkeletonBlock className="col-span-1 h-3" />
            <SkeletonBlock className="col-span-5 h-3" />
            <SkeletonBlock className="col-span-3 h-3" />
            <SkeletonBlock className="col-span-3 h-3" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-4">
              <SkeletonBlock className="col-span-1 h-3" />
              <SkeletonBlock className="col-span-5 h-3" />
              <SkeletonBlock className="col-span-3 h-3" />
              <SkeletonBlock className="col-span-3 h-3" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-3 w-44" />
          <SkeletonBlock className="h-6 w-48" />
        </div>
      </div>
    </div>
  );
}

export function RegisterSkeleton() {
  return (
    <div>
      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-6 w-72" />
          <SkeletonBlock className="mt-2 h-4 w-64" />
        </div>
        <SkeletonBlock className="h-9 w-36" />
      </div>

      {/* Filter */}
      <div className="mb-5 flex items-center gap-3">
        <SkeletonBlock className="h-9 w-56" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="mt-3 h-7 w-28" />
            <SkeletonBlock className="mt-3 h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-44" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-72 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-center p-5">
            <SkeletonBlock className="h-56 w-56 rounded-full" />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-72 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-3">
            <SkeletonBlock className="col-span-1 h-3" />
            <SkeletonBlock className="col-span-5 h-3" />
            <SkeletonBlock className="col-span-4 h-3" />
            <SkeletonBlock className="col-span-2 h-3" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-4">
              <SkeletonBlock className="col-span-1 h-3" />
              <SkeletonBlock className="col-span-5 h-3" />
              <SkeletonBlock className="col-span-4 h-3" />
              <SkeletonBlock className="col-span-2 h-3" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-3 w-44" />
          <SkeletonBlock className="h-6 w-48" />
        </div>
      </div>
    </div>
  );
}

export function BeritaSkeleton() {
  return (
    <div>
      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="mt-2 h-4 w-72" />
        </div>
      </div>

      {/* Card tabel */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="mt-2 h-3 w-56" />
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-3">
            <SkeletonBlock className="col-span-1 h-3" />
            <SkeletonBlock className="col-span-7 h-3" />
            <SkeletonBlock className="col-span-2 h-3" />
            <SkeletonBlock className="col-span-2 h-3" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-4">
              <SkeletonBlock className="col-span-1 h-3" />
              <SkeletonBlock className="col-span-7 h-3" />
              <SkeletonBlock className="col-span-2 h-3" />
              <SkeletonBlock className="col-span-2 h-3" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-3 w-40" />
          <SkeletonBlock className="h-6 w-48" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="mt-2 h-4 w-80" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="mt-3 h-7 w-32" />
            <SkeletonBlock className="mt-3 h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-72 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-36" />
          </div>
          <div className="flex items-center justify-center p-5">
            <SkeletonBlock className="h-64 w-64 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-36" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="p-5">
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CuacaMobileSkeleton() {
  return (
    <main className="min-h-screen bg-white px-5 pb-10 pt-6">
      <div className="mx-auto w-full max-w-[480px]">
        {/* Header lokasi */}
        <div className="mb-7 flex items-center gap-2">
          <SkeletonBlock className="h-5 w-5 rounded-full" />
          <SkeletonBlock className="h-4 w-56" />
        </div>

        {/* Cuaca */}
        <div className="mb-9">
          <div className="mb-4 flex items-center gap-2.5">
            <SkeletonBlock className="h-5 w-5 rounded-full" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="flex flex-col items-center border-b border-slate-100 pb-6">
            <SkeletonBlock className="h-[72px] w-[72px] rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-36" />
            <SkeletonBlock className="mt-2 h-14 w-28" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-2 text-center">
                <SkeletonBlock className="mx-auto h-6 w-6 rounded-full" />
                <SkeletonBlock className="mx-auto mt-2 h-4 w-12" />
                <SkeletonBlock className="mx-auto mt-1 h-3 w-14" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-4 w-32" />
          <div className="mt-3 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Peringatan */}
        <div className="mb-9">
          <div className="mb-4 flex items-center gap-2.5">
            <SkeletonBlock className="h-5 w-5 rounded-full" />
            <SkeletonBlock className="h-4 w-44" />
          </div>
          <SkeletonBlock className="h-24 w-full rounded-2xl" />
        </div>

        {/* Gempa */}
        <div className="mb-9">
          <div className="mb-4 flex items-center gap-2.5">
            <SkeletonBlock className="h-5 w-5 rounded-full" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex items-center justify-center gap-6 rounded-2xl border border-slate-100 px-5 py-5">
            <SkeletonBlock className="h-24 w-24 rounded-full" />
            <div className="space-y-2.5">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-4 w-40" />
            </div>
          </div>
        </div>

        <SkeletonBlock className="mx-auto mt-7 h-3 w-64" />
      </div>
    </main>
  );
}

export function CuacaSkeleton() {
  return (
    <div>
      {/* PageHeader */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="mt-2 h-4 w-80" />
        </div>
        <SkeletonBlock className="h-9 w-32" />
      </div>

      {/* Lokasi bar */}
      <div className="mb-6 flex items-center gap-2">
        <SkeletonBlock className="h-4 w-4 rounded-full" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      {/* Cuaca sekarang */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <SkeletonBlock className="h-4 w-44" />
        </div>
        <div className="p-5">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6 text-center">
            <SkeletonBlock className="h-16 w-16 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-40" />
            <SkeletonBlock className="mt-2 h-10 w-24" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-4">
                <SkeletonBlock className="mx-auto h-6 w-6 rounded-full" />
                <SkeletonBlock className="mx-auto mt-2 h-5 w-20" />
                <SkeletonBlock className="mx-auto mt-1 h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <SkeletonBlock className="h-4 w-40" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Peringatan dini */}
      <div className="mt-6 rounded-xl border border-red-200 bg-red-600 p-5">
        <SkeletonBlock className="h-4 w-48 bg-white/40" />
        <SkeletonBlock className="mt-3 h-16 w-full bg-white/30" />
      </div>

      {/* Gempa */}
      <div className="mt-6 rounded-xl border border-teal-200 bg-teal-600 p-5">
        <SkeletonBlock className="h-4 w-52 bg-white/40" />
        <div className="mt-3 flex items-center justify-center gap-5">
          <SkeletonBlock className="h-24 w-24 rounded-full bg-white/30" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40 bg-white/30" />
            <SkeletonBlock className="h-4 w-40 bg-white/30" />
            <SkeletonBlock className="h-4 w-40 bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}