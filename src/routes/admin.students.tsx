import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerStudent, updateStaffUser, updateStudentRecord } from "@/lib/admin.functions";
import {
  fetchAllStudentsDirectory,
  fetchClasses,
  fetchDepartments,
  STUDENT_TYPE_LABEL,
} from "@/lib/queries";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Manage Students — Campus Leave" },
      {
        name: "description",
        content:
          "Add, edit, activate or deactivate hosteller and day scholar student accounts across departments.",
      },
      { property: "og:title", content: "Manage Students — Campus Leave" },
      { property: "og:description", content: "Student account administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminStudents,
});

type Directory = Awaited<ReturnType<typeof fetchAllStudentsDirectory>>[number];

const NEW_STUDENT = {
  fullName: "",
  email: "",
  registerNumber: "",
  password: "",
  confirmPassword: "",
  studentType: "HOSTELLER",
  departmentId: "",
  classId: "",
};

function AdminStudents() {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...NEW_STUDENT });
  const [editing, setEditing] = useState<Directory | null>(null);

  const students = useQuery({
    queryKey: ["students-directory"],
    queryFn: fetchAllStudentsDirectory,
  });
  const departments = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  const deptName = (id: string) =>
    (departments.data ?? []).find((d) => d.id === id)?.department_name ?? "—";
  const className = (id: string) => (classes.data ?? []).find((c) => c.id === id)?.class_name ?? "—";

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (students.data ?? []).filter(
      (s) =>
        !q ||
        s.register_number.toLowerCase().includes(q) ||
        (s.profile?.full_name ?? "").toLowerCase().includes(q) ||
        (s.profile?.email ?? "").toLowerCase().includes(q),
    );
  }, [students.data, term]);

  const create = useMutation({
    mutationFn: () => registerStudent({ data: form }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Student account created.");
      setCreating(false);
      setForm({ ...NEW_STUDENT });
      void qc.invalidateQueries({ queryKey: ["students-directory"] });
    },
    onError: () => toast.error("Please check the details and try again."),
  });

  const save = useMutation({
    mutationFn: async (input: {
      row: Directory;
      registerNumber: string;
      studentType: string;
      departmentId: string;
      classId: string;
      status: "ACTIVE" | "INACTIVE";
    }) => {
      const a = await updateStudentRecord({
        data: {
          studentId: input.row.id,
          registerNumber: input.registerNumber,
          studentType: input.studentType as "HOSTELLER" | "DAY_SCHOLAR",
          departmentId: input.departmentId,
          classId: input.classId,
        },
      });
      if (!a.ok) throw new Error(a.error);
      const b = await updateStaffUser({ data: { userId: input.row.user_id, status: input.status } });
      if (!b.ok) throw new Error(b.error);
    },
    onSuccess: () => {
      toast.success("Student record updated.");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["students-directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell role="ADMIN" title="Students" description="Manage student accounts and records">
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email or register number"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreating(true)}>
            <UserPlus className="mr-2 size-4" /> Add student
          </Button>
        </div>

        {students.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Register no.</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Class</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-border/70">
                    <td className="px-5 py-3">
                      <span className="font-medium">{s.profile?.full_name ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.profile?.email ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{s.register_number}</td>
                    <td className="px-5 py-3">{STUDENT_TYPE_LABEL[s.student_type]}</td>
                    <td className="px-5 py-3">{deptName(s.department_id)}</td>
                    <td className="px-5 py-3">{className(s.class_id)}</td>
                    <td className="px-5 py-3">
                      {s.profile?.status && <StatusBadge value={s.profile.status} />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create student */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a student</DialogTitle>
            <DialogDescription>
              The student can sign in with their email or register number.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <TextField
              label="Register number"
              value={form.registerNumber}
              onChange={(v) => setForm({ ...form, registerNumber: v.toUpperCase() })}
            />
            <div className="space-y-2">
              <Label>Student type</Label>
              <Select
                value={form.studentType}
                onValueChange={(v) => setForm({ ...form, studentType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOSTELLER">Hosteller</SelectItem>
                  <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm({ ...form, departmentId: v, classId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(departments.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={form.classId}
                onValueChange={(v) => setForm({ ...form, classId: v })}
                disabled={!form.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(classes.data ?? [])
                    .filter((c) => c.department_id === form.departmentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.class_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v, confirmPassword: v })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editing && (
        <EditStudentDialog
          row={editing}
          departments={departments.data ?? []}
          classes={classes.data ?? []}
          pending={save.isPending}
          onClose={() => setEditing(null)}
          onSave={(v) => save.mutate({ row: editing, ...v })}
        />
      )}
    </AppShell>
  );
}

function EditStudentDialog({
  row,
  departments,
  classes,
  pending,
  onClose,
  onSave,
}: {
  row: Directory;
  departments: { id: string; department_name: string }[];
  classes: { id: string; class_name: string; department_id: string }[];
  pending: boolean;
  onClose: () => void;
  onSave: (v: {
    registerNumber: string;
    studentType: string;
    departmentId: string;
    classId: string;
    status: "ACTIVE" | "INACTIVE";
  }) => void;
}) {
  const [registerNumber, setRegisterNumber] = useState(row.register_number);
  const [studentType, setStudentType] = useState<string>(row.student_type);
  const [departmentId, setDepartmentId] = useState(row.department_id);
  const [classId, setClassId] = useState(row.class_id);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(row.profile?.status ?? "ACTIVE");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {row.profile?.full_name ?? "student"}</DialogTitle>
          <DialogDescription>Update academic details or account status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Register number"
            value={registerNumber}
            onChange={(v) => setRegisterNumber(v.toUpperCase())}
          />
          <div className="space-y-2">
            <Label>Student type</Label>
            <Select value={studentType} onValueChange={setStudentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOSTELLER">Hosteller</SelectItem>
                <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v);
                setClassId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter((c) => c.department_id === departmentId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.class_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Account status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ACTIVE" | "INACTIVE")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave({ registerNumber, studentType, departmentId, classId, status })}
            disabled={pending || !classId}
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
