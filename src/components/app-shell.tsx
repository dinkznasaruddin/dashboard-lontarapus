"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { MenuGroup } from "@/lib/menu";

export function AppShell({
  menu,
  username,
  role,
  children,
}: {
  menu: MenuGroup[];
  username: string;
  role: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar-collapsed") === "1") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar menu={menu} username={username} collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar nama={username} role={role} onToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}