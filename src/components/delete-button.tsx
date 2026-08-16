"use client";

import { Trash2 } from "lucide-react";

/** Tombol hapus dengan konfirmasi (client) — dipakai dalam server component. */
export function DeleteButton({
  action,
  confirmText,
  title = "Hapus",
}: {
  action: () => Promise<void>;
  confirmText: string;
  title?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        title={title}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}