import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { fetchClasses, fetchDepartments, fetchMyStudent } from "@/lib/queries";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Campus Leave" },
      {
        name: "description",
        content:
          "View your student profile details including register number, department, class and residence type.",
      },
      { property: "og:title", content: "My Profile — Campus Leave" },
      { property: "og:description", content: "Your student account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { userId, profile } = useAuth();
  const student = useQuery({
    queryKey: ["my-student", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyStudent(userId!),
  });

  const departments = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  const s = student.data;
  const departmentName =
    (departments.data ?? []).find((d) => d.id === s?.department_id)?.department_name ?? "—";
  const className = (classes.data ?? []).find((c) => c.id === s?.class_id)?.class_name ?? "—";
  const rows: Array<[string, string]> = [
    ["Full name", profile?.full_name ?? "—"],
    ["Email address", profile?.email ?? "—"],
    ["Register number", s?.register_number ?? "—"],
    ["Student type", s?.student_type === "DAY_SCHOLAR" ? "Day Scholar" : "Hosteller"],
    ["Department", departmentName],
    ["Class", className],
  ];

  return (
    <AppShell role="STUDENT" title="My profile" description="Your registered academic details">
      <div className="surface-card mx-auto max-w-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Account details</h2>
          {profile?.status && <StatusBadge value={profile.status} />}
        </div>
        <dl className="mt-6 divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Academic details are managed by the college administration. Contact your administrator if
          anything here is incorrect.
        </p>
      </div>
    </AppShell>
  );
}
