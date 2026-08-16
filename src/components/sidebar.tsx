"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Gauge,
  Settings,
  Footprints,
  Megaphone,
  Users,
  CalendarDays,
  GraduationCap,
  BarChart3,
  Bot,
  HeartPulse,
  Mail,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import type { MenuGroup } from "@/lib/menu";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  tachometer: Gauge,
  cog: Settings,
  running: Footprints,
  bullhorn: Megaphone,
  users: Users,
  calendar: CalendarDays,
  "graduation-cap": GraduationCap,
  chart: BarChart3,
  robot: Bot,
  heartbeat: HeartPulse,
  mail: Mail,
};

export function Sidebar({
  menu,
  username,
  collapsed,
  onToggle,
}: {
  menu: MenuGroup[];
  username: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const groupOpen = (group: MenuGroup) => {
    if (open !== null) return open === group.key;
    return group.items.some((item) => isActive(item.href));
  };

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-200",
        collapsed ? "w-[6.5rem]" : "w-64"
      )}
    >
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center justify-center border-b border-slate-100 px-3"
      >
        {collapsed ? (
          <img src="/img/logo-small.png" alt="Lontara+" className="h-[60px] w-[60px] object-contain" />
        ) : (
          <img
            src="/img/logo-lontara.png"
            alt="Lontara+"
            className="h-10 w-auto object-contain"
            style={{ maxWidth: 150 }}
          />
        )}
      </Link>

      <nav className={cn("flex-1 p-3", collapsed ? "overflow-visible" : "overflow-y-auto")}>
        {menu.map((group) => {
          const Icon = ICONS[group.icon] ?? Gauge;
          const single = group.items.length === 1;
          const active = group.items.some((item) => isActive(item.href));

          if (single) {
            const item = group.items[0];
            return (
              <div key={group.key} className="group relative mb-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    collapsed && "justify-center px-0",
                    isActive(item.href)
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && item.label}
                </Link>
                {collapsed && (
                  <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-lg group-hover:block">
                    {item.label}
                  </span>
                )}
              </div>
            );
          }

          const expanded = groupOpen(group);
          return (
            <div key={group.key} className="group relative mb-1">
              <button
                type="button"
                onClick={() => !collapsed && setOpen(expanded ? null : group.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                    />
                  </>
                )}
              </button>

              {!collapsed && expanded && (
                <div className="mt-1 ml-5 space-y-0.5 border-l border-slate-200 pl-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition",
                        isActive(item.href)
                          ? "font-semibold text-blue-700"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {collapsed && (
                <div className="pointer-events-none absolute left-full top-0 z-30 ml-1 hidden w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg group-hover:block">
                  <p className="mb-1 px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between gap-2")}>
          {!collapsed && (
            <p className="truncate px-1 text-xs text-slate-500">
              Login sebagai <span className="font-semibold text-slate-800">{username}</span>
            </p>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}