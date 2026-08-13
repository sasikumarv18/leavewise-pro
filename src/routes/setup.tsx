import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminExists, bootstrapAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Administrator Setup — Campus Leave" },
      {
        name: "description",
        content:
          "One-time setup to create the first administrator account for the college leave management system.",
      },
      { property: "og:title", content: "Administrator Setup — Campus Leave" },
      { property: "og:description", content: "Create the first administrator account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const exists = useQuery({ queryKey: ["admin-exists"], queryFn: () => adminExists() });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await bootstrapAdmin({ data: form });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Administrator account created. Please sign in.");
      void navigate({ to: "/auth" });
    } catch {
      toast.error("Password must be at least 8 characters with a letter and a number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="surface-card w-full max-w-md p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Administrator setup</h1>

        {exists.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking system status…</p>
        ) : exists.data?.exists ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              An administrator account already exists for this system. Sub-admin accounts can only
              be created from inside the admin dashboard.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              This one-time page creates the first administrator. It is disabled automatically once
              an administrator exists.
            </p>
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
              <Label htmlFor="email">Email address</Label>
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
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create administrator
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
