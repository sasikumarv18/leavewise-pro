import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileStack,
  Hourglass,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  computeStats,
  fetchAllStudentsDirectory,
  fetchLeaves,
  formatDate,
  LEAVE_TYPE_LABEL,
} from "@/lib/queries";

export const Route = createFileRoute("/subadmin/")({
  head: () => ({
    meta: [
      { title: "Sub-Admin Dashboard — Campus Leave" },
      {
        name: "description",
        content:
          "Monitor pending, approved and rejected student leave requests across hostellers and day scholars.",
      },
      { property: "og:title", content: "Sub-Admin Dashboard — Campus Leave" },
      { property: "og:description", content: "Leave approval overview for staff reviewers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubAdminDashboard,
});

function SubAdminDashboard() {
  const leaves = useQuery({ queryKey: ["all-leaves"], queryFn: () => fetchLeaves() });
  const students = useQuery({ queryKey: ["students-directory"], queryFn: fetchAllStudentsDirectory });

  const rows = leaves.data ?? [];
  const stats = computeStats(rows);
  const nameByStudentId = new Map(
    (students.data ?? []).map((s) => [s.id, s.profile?.full_name ?? s.register_number]),
  );
  const pending = rows.filter((r) => r.status === "PENDING").slice(0, 6);

  return (
    <AppShell
      role="SUB_ADMIN"
      title="Leave approvals overview"
      description="Review and act on student leave requests"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total requests" value={stats.total} icon={FileStack} />
        <StatCard label="Pending review" value={stats.pending} icon={Hourglass} tone="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="destructive" />
        <StatCard
          label="Approved leave days"
          value={stats.approvedDays}
          icon={CalendarClock}
          tone="info"
        />
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold">Awaiting your review</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/subadmin/requests">
              <ClipboardList className="mr-2 size-4" /> All requests
            </Link>
          </Button>
        </div>
        {leaves.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nothing pending — all caught up.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Application</th>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Days</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-t border-border/70">
                    <td className="px-5 py-3 font-mono text-xs">{r.application_number}</td>
                    <td className="px-5 py-3">{nameByStudentId.get(r.student_id) ?? "—"}</td>
                    <td className="px-5 py-3">{LEAVE_TYPE_LABEL[r.leave_type]}</td>
                    <td className="px-5 py-3">
                      {formatDate(r.start_date)} → {formatDate(r.end_date)}
                    </td>
                    <td className="px-5 py-3">{r.number_of_days}</td>
                    <td className="px-5 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
