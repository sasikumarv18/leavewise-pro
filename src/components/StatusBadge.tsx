const STYLES: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning-foreground border-warning/40",
  APPROVED: "bg-success/15 text-success border-success/40",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/40",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-success/15 text-success border-success/40",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  HOSTELLER: "bg-info/10 text-info border-info/30",
  DAY_SCHOLAR: "bg-accent/20 text-accent-foreground border-accent/40",
};

export function StatusBadge({ value }: { value: string }) {
  const label = value.replace("_", " ").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STYLES[value] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {label}
    </span>
  );
}
