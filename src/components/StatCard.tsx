import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="surface-card flex items-center gap-4 p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
