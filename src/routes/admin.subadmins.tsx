import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Pencil, ShieldPlus } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { createSubAdmin, listStaffProfiles, updateStaffUser } from "@/lib/admin.functions";
import { fetchDepartments } from "@/lib/queries";

export const Route = createFileRoute("/admin/subadmins")({
  head: () => ({
    meta: [
      { title: "Manage Sub-Admins — Campus Leave" },
      {
        name: "description",
        content:
          "Create sub-admin reviewer accounts, reset their passwords and control access to leave approvals.",
      },
      { property: "og:title", content: "Manage Sub-Admins — Campus Leave" },
      { property: "og:description", content: "Sub-admin account administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSubAdmins,
});

type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  department_id: string | null;
  role: "ADMIN" | "SUB_ADMIN";
};

function AdminSubAdmins() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", departmentId: "" });
  const [resetting, setResetting] = useState<StaffRow | null>(null);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [editDepartment, setEditDepartment] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const departments = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const staff = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => (await listStaffProfiles()).staff as StaffRow[],
  });

  const create = useMutation({
    mutationFn: () => createSubAdmin({ data: form }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Sub-admin account created.");
      setCreating(false);
       setForm({ fullName: "", email: "", password: "", departmentId: "" });
       void qc.invalidateQueries({ queryKey: ["staff-profiles"] });
    },
    onError: () =>
      toast.error("Password must be at least 8 characters with a letter and a number."),
  });

  const update = useMutation({
    mutationFn: (input: {
      userId: string;
      status?: "ACTIVE" | "INACTIVE";
      newPassword?: string;
      departmentId?: string | null;
    }) =>
      updateStaffUser({ data: input }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Sub-admin account updated.");
       setResetting(null);
       setEditing(null);
      setNewPassword("");
       void qc.invalidateQueries({ queryKey: ["staff-profiles"] });
    },
    onError: () => toast.error("The update could not be applied."),
  });

  return (
    <AppShell
      role="ADMIN"
      title="Sub-admins"
      description="Staff members who review and decide leave requests"
    >
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold">Staff accounts</h2>
          <Button onClick={() => setCreating(true)}>
            <ShieldPlus className="mr-2 size-4" /> Add sub-admin
          </Button>
        </div>
        {staff.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (staff.data ?? []).length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            No staff accounts yet. Create a sub-admin to start reviewing leave requests.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {(staff.data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                 <div>
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-sm text-muted-foreground">{s.email}</p>
                   <p className="mt-1 text-xs text-muted-foreground">
                     {s.role === "ADMIN" ? "Administrator" : "Sub-Admin"} · {departments.data?.find((d) => d.id === s.department_id)?.department_name ?? "No department"}
                   </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={s.status} />
                  <Select
                    value={s.status}
                    onValueChange={(v) =>
                      update.mutate({ userId: s.id, status: v as "ACTIVE" | "INACTIVE" })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => setResetting(s)}>
                    <KeyRound className="mr-2 size-4" /> Reset password
                  </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => {
                       setEditing(s);
                       setEditDepartment(s.department_id ?? "");
                     }}
                   >
                     <Pencil className="mr-2 size-4" /> Edit
                   </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a sub-admin</DialogTitle>
            <DialogDescription>
              Sub-admins can approve or reject leave requests but cannot manage accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(departmentId) => setForm({ ...form, departmentId })}
              >
                <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                <SelectContent>
                  {(departments.data ?? []).map((department) => (
                    <SelectItem key={department.id} value={department.id}>{department.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, including a letter and a number.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetting)} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>{resetting?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(null)}>
              Cancel
            </Button>
            <Button
              disabled={update.isPending || newPassword.length < 8}
              onClick={() =>
                resetting && update.mutate({ userId: resetting.id, newPassword: newPassword })
              }
            >
              {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit staff profile</DialogTitle>
            <DialogDescription>{editing?.full_name} · {editing?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editDepartment || "none"} onValueChange={(value) => setEditDepartment(value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {(departments.data ?? []).map((department) => (
                    <SelectItem key={department.id} value={department.id}>{department.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              disabled={update.isPending || !editing}
              onClick={() => editing && update.mutate({ userId: editing.id, departmentId: editDepartment || null })}
            >
              {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
