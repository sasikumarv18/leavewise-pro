import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { requestStaffAccount } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/staff-register")({
  head: () => ({
    meta: [
      { title: "Staff Registration — Campus Leave" },
      {
        name: "description",
        content:
          "Apply for an administrator or sub-admin account. Requests are reviewed and approved by an existing college administrator.",
      },
      { property: "og:title", content: "Staff Registration — Campus Leave" },
      {
        property: "og:description",
        content: "Request an admin or sub-admin account for the college leave portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffRegister,
});

const EMPTY = {
  fullName: "",
  email: "",
  password: "",
  requestedRole: "SUB_ADMIN" as "ADMIN" | "SUB_ADMIN",
  message: "",
};

function StaffRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await requestStaffAccount({
        data: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          requestedRole: form.requestedRole,
          ...(form.message.trim() ? { message: form.message.trim() } : {}),
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDone(true);
      toast.success("Request submitted for administrator approval.");
    } catch {
      toast.error("Please check the form. Passwords need 8+ characters with a letter and a number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="surface-card w-full max-w-lg p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldPlus className="size-5" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Staff registration</h1>

        {done ? (
          <div className="mt-4 space-y-5">
            <p className="text-sm text-muted-foreground">
              Your request has been sent to the college administrators. Your account stays inactive
              until it is approved — you can sign in any time to check the status.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to="/auth">Go to sign in</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Apply for an administrator or sub-admin account. An existing administrator reviews
              every request before access is granted.
            </p>

            <div className="space-y-2">
              <Label>Role requested</Label>
              <Select
                value={form.requestedRole}
                onValueChange={(v) =>
                  setForm({ ...form, requestedRole: v as "ADMIN" | "SUB_ADMIN" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUB_ADMIN">Sub-Admin (reviews leave requests)</SelectItem>
                  <SelectItem value="ADMIN">Administrator (full system access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Official email address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, including a letter and a number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Note for the administrator (optional)</Label>
              <Textarea
                id="message"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Department, designation or staff ID"
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit request
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Student?{" "}
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Register here
              </Link>{" "}
              · Already approved?{" "}
              <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
      <button type="button" className="sr-only" onClick={() => void navigate({ to: "/" })}>
        home
      </button>
    </div>
  );
}
