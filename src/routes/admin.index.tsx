import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  FileStack,
  Hourglass,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { seedDemoData } from "@/lib/admin.functions";
import { computeStats, fetchAllStudentsDirectory, fetchLeaves } from "@/lib/queries";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Campus Leave" },
      {
        name: "description",
        content:
          "College-wide overview of students, sub-admins and leave activity with quick management shortcuts.",
      },
      { property: "og:title", content: "Admin Dashboard — Campus Leave" },
      { property: "og:description", content: "College-wide leave management overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const qc = useQueryClient();
  const leaves = useQuery({ queryKey: ["all-leaves"], queryFn: () => fetchLeaves() });
  const students = useQuery({
    queryKey: ["students-directory"],
    queryFn: fetchAllStudentsDirectory,
  });
  const stats = computeStats(leaves.data ?? []);

  const seed = useMutation({
    mutationFn: () => seedDemoData(),
    onSuccess: () => {
      toast.success("Demo data created. Save the credentials shown below.");
      void qc.invalidateQueries();
    },
    onError: () => toast.error("Demo data could not be created."),
  });

  const hostellers = (students.data ?? []).filter((s) => s.student_type === "HOSTELLER").length;
  const dayScholars = (students.data ?? []).length - hostellers;

  return (
    <AppShell
      role="ADMIN"
      title="Administrator dashboard"
      description="Full control over accounts, departments and leave records"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Students" value={(students.data ?? []).length} icon={Users} />
        <StatCard label="Total applications" value={stats.total} icon={FileStack} tone="info" />
        <StatCard label="Pending" value={stats.pending} icon={Hourglass} tone="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="destructive" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Student distribution</h2>
          <div className="mt-4 space-y-4">
            <Bar label="Hostellers" value={hostellers} total={(students.data ?? []).length} />
            <Bar label="Day Scholars" value={dayScholars} total={(students.data ?? []).length} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/admin/students">Manage students</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/subadmins">Manage sub-admins</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/leaves">All leave applications</Link>
            </Button>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Demo data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Populate the system with sample sub-admins, students and leave history so you can
            explore every workflow. Generated credentials are shown once.
          </p>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
          >
            {seed.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Database className="mr-2 size-4" />
            )}
            Generate demo data
          </Button>
          {seed.data?.credentials && (
            <ul className="mt-4 space-y-2 text-xs">
              {seed.data.credentials.map((c) => (
                <li key={c.email} className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="font-medium">{c.name} · {c.role}</p>
                  <p className="font-mono">{c.email}</p>
                  <p className="font-mono">{c.password}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
