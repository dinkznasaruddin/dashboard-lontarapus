import { requireAuth } from "@/lib/auth";
import { getAccessibleMenu } from "@/lib/menu";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const menu = getAccessibleMenu(session);

  return (
    <AppShell menu={menu} username={session.nama} role={session.role}>
      {children}
    </AppShell>
  );
}
