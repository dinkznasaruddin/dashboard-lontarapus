"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Peta guncangan (shakemap) tersembunyi secara default, tampil via tombol. */
export function ShakemapBlock({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 px-4 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#B21D28]"
      >
        <span>Peta Guncangan (Shakemap)</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Shakemap Gempa"
            className="w-full rounded-lg border border-slate-100 object-contain"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}