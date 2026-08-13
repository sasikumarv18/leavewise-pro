import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  FileClock,
  FileStack,
  XCircle,
  Hourglass,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  computeStats,
  fetchLeaves,
  fetchMyStudent,
  formatDate,
  LEAVE_TYPE_LABEL,
} from "@/lib/queries";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Campus Leave" },
      {
        name: "description",
        content: "Track your leave applications, pending approvals and approved leave days.",
      },
      { property: "og:title", content: "Student Dashboard — Campus Leave" },
      { property: "og:description", content: "Your personal leave overview and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { userId, profile } = useAuth();
  const student = useQuery({
    queryKey: ["my-student", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyStudent(userId!),
  });
  const leaves = useQuery({
    queryKey: ["my-leaves", student.data?.id],
    enabled: Boolean(student.data?.id),
    queryFn: () => fetchLeaves(student.data!.id),
  });

  const rows = leaves.data ?? [];
  const stats = computeStats(rows);

  return (
    <AppShell
      role="STUDENT"
      title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "student"}`}
      description={student.data ? `Register number ${student.data.register_number}` : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total applications" value={stats.total} icon={FileStack} />
        <StatCard label="Pending" value={stats.pending} icon={Hourglass} tone="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="destructive" />
        <StatCard
          label="Approved leave days"
          value={stats.approvedDays}
          icon={CalendarClock}
          tone="info"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/student/apply">
            <CalendarPlus className="mr-2 size-4" /> Apply leave
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/student/leaves">
            <FileClock className="mr-2 size-4" /> My leave history
          </Link>
        </Button>
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold">Recent applications</h2>
          <Link to="/student/leaves" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {leaves.isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">No leave applications yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your submitted applications will appear here.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/student/apply">Apply for leave</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Application ID</th>
                  <th className="px-5 py-3 font-semibold">Leave type</th>
                  <th className="px-5 py-3 font-semibold">From</th>
                  <th className="px-5 py-3 font-semibold">To</th>
                  <th className="px-5 py-3 font-semibold">Days</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((r) => (
                  <tr key={r.id} className="border-t border-border/70">
                    <td className="px-5 py-3 font-mono text-xs">{r.application_number}</td>
                    <td className="px-5 py-3">{LEAVE_TYPE_LABEL[r.leave_type]}</td>
                    <td className="px-5 py-3">{formatDate(r.start_date)}</td>
                    <td className="px-5 py-3">{formatDate(r.end_date)}</td>
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
