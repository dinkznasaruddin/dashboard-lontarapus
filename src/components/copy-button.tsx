"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Tombol salin ke clipboard (client) — dipakai dalam server component. */
export function CopyButton({ text, title = "Salin" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={title}
      className="text-slate-300 transition hover:text-slate-600"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}