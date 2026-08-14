import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addClass, addDepartment } from "@/lib/admin.functions";
import { fetchClasses, fetchDepartments } from "@/lib/queries";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments & Classes — Campus Leave" },
      {
        name: "description",
        content:
          "Maintain the department and class structure used for student registration and leave reporting.",
      },
      { property: "og:title", content: "Departments & Classes — Campus Leave" },
      { property: "og:description", content: "Department and class administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDepartments,
});

function AdminDepartments() {
  const qc = useQueryClient();
  const departments = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  const [dept, setDept] = useState({ departmentName: "", code: "" });
  const [cls, setCls] = useState({ departmentId: "", className: "" });

  const createDept = useMutation({
    mutationFn: () => addDepartment({ data: dept }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Department added.");
      setDept({ departmentName: "", code: "" });
      void qc.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: () => toast.error("Please check the department details."),
  });

  const createClass = useMutation({
    mutationFn: () => addClass({ data: cls }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Class added.");
      setCls({ departmentId: "", className: "" });
      void qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: () => toast.error("Please check the class details."),
  });

  return (
    <AppShell
      role="ADMIN"
      title="Departments & classes"
      description="Academic structure used across the system"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Departments</h2>
          {departments.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(departments.data ?? []).map((d) => (
                <li key={d.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <BookMarked className="size-4 text-primary" />
                    <p className="font-medium">{d.department_name}</p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {d.code}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(classes.data ?? [])
                      .filter((c) => c.department_id === d.id)
                      .map((c) => (
                        <span
                          key={c.id}
                          className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                        >
                          {c.class_name}
                        </span>
                      ))}
                    {(classes.data ?? []).filter((c) => c.department_id === d.id).length === 0 && (
                      <span className="text-xs text-muted-foreground">No classes yet</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="font-display text-base font-semibold">Add department</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Department name</Label>
                <Input
                  value={dept.departmentName}
                  onChange={(e) => setDept({ ...dept, departmentName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Short code</Label>
                <Input
                  value={dept.code}
                  placeholder="CSE"
                  onChange={(e) => setDept({ ...dept, code: e.target.value.toUpperCase() })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createDept.mutate()}
                disabled={createDept.isPending}
              >
                {createDept.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Add department
              </Button>
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="font-display text-base font-semibold">Add class</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={cls.departmentId}
                  onChange={(e) => setCls({ ...cls, departmentId: e.target.value })}
                >
                  <option value="">Select department</option>
                  {(departments.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Class name</Label>
                <Input
                  value={cls.className}
                  placeholder="III-A"
                  onChange={(e) => setCls({ ...cls, className: e.target.value.toUpperCase() })}
                />
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => createClass.mutate()}
                disabled={createClass.isPending || !cls.departmentId}
              >
                {createClass.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Add class
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
