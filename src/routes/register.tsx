import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerStudent } from "@/lib/admin.functions";
import { studentRegistrationSchema } from "@/lib/validation";
import { fetchClasses, fetchDepartments } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Student Registration — Campus Leave" },
      {
        name: "description",
        content:
          "Register as a hosteller or day scholar to apply for college leave online, track approvals and receive notifications.",
      },
      { property: "og:title", content: "Student Registration — Campus Leave" },
      {
        property: "og:description",
        content: "Create your student account for the college leave management portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const EMPTY = {
  fullName: "",
  email: "",
  registerNumber: "",
  password: "",
  confirmPassword: "",
  studentType: "HOSTELLER",
  departmentId: "",
  classId: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const departments = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const classes = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  const classOptions = useMemo(
    () => (classes.data ?? []).filter((c) => c.department_id === form["departmentId"]),
    [classes.data, form],
  );

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value, ...(key === "departmentId" ? { classId: "" } : {}) }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = studentRegistrationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await registerStudent({ data: parsed.data });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Registration successful. You can now sign in.");
      void navigate({ to: "/auth" });
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 py-10 text-primary-foreground sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg accent-gradient text-accent-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-base font-semibold">Campus Leave</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold">Student registration</h1>
          <p className="mt-2 text-sm text-primary-foreground/80">
            Fill in your personal and academic details to create your leave account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <div className="surface-card space-y-8 p-6 sm:p-8">
          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Personal information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors["fullName"]}>
                <Input value={form["fullName"]} onChange={(e) => set("fullName", e.target.value)} />
              </Field>
              <Field label="Email address" error={errors["email"]}>
                <Input
                  type="email"
                  value={form["email"]}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Register number" error={errors["registerNumber"]}>
                <Input
                  value={form["registerNumber"]}
                  placeholder="23IT101"
                  onChange={(e) => set("registerNumber", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Student type" error={errors["studentType"]}>
                <Select value={form["studentType"]} onValueChange={(v) => set("studentType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOSTELLER">Hosteller</SelectItem>
                    <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Password" error={errors["password"]}>
                <Input
                  type="password"
                  value={form["password"]}
                  onChange={(e) => set("password", e.target.value)}
                />
              </Field>
              <Field label="Confirm password" error={errors["confirmPassword"]}>
                <Input
                  type="password"
                  value={form["confirmPassword"]}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Academic information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" error={errors["departmentId"]}>
                <Select value={form["departmentId"]} onValueChange={(v) => set("departmentId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Class" error={errors["classId"]}>
                <Select
                  value={form["classId"]}
                  onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                  disabled={!form["departmentId"]}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form["departmentId"] ? "Select class" : "Select a department first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/auth" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Button type="submit" size="lg" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create account
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
