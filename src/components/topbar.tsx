"use client";

import Link from "next/link";
import { LogOut, Menu, User } from "lucide-react";

export function Topbar({
  nama,
  role,
  onToggle,
}: {
  nama: string;
  role: string;
  onToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:hidden"
          title="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-slate-500">
          Dashboard Superapps Makassar
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-800">{nama}</p>
            <p className="text-xs leading-tight text-slate-400">{role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User className="h-4 w-4" />
          </div>
        </div>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </header>
  );
}