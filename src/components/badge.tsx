import { cn } from "@/lib/utils";

export function Badge({
  children,
  color = "slate",
  className,
}: {
  children: React.ReactNode;
  color?: "green" | "red" | "yellow" | "blue" | "slate" | "gray";
  className?: string;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700 ring-green-200",
    red: "bg-red-100 text-red-700 ring-red-200",
    yellow: "bg-yellow-100 text-yellow-700 ring-yellow-200",
    blue: "bg-blue-100 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    gray: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "online" | "offline" | string }) {
  const isOnline = status === "online";
  return (
    <Badge color={isOnline ? "green" : "red"}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOnline ? "bg-green-500" : "bg-red-500"
        )}
      />
      {isOnline ? "Online" : "Offline"}
    </Badge>
  );
}
