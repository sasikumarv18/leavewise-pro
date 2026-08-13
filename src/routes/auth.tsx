import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/admin.functions";
import { useAuth, homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Campus Leave" },
      {
        name: "description",
        content:
          "Sign in to the Campus Leave portal as a student, sub-admin or administrator using your email or register number.",
      },
      { property: "og:title", content: "Sign in — Campus Leave" },
      { property: "og:description", content: "Access your college leave management dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && role) {
      void navigate({ to: homeForRole(role), replace: true });
    }
  }, [loading, session, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        // Register-number login: resolve through an authenticated-safe lookup.
        const res = await resolveLoginEmail({ data: { registerNumber: email } });
        if (!res.email) {
          toast.error("Invalid email/register number or password.");
          setBusy(false);
          return;
        }
        email = res.email;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });
      if (error) {
        toast.error("Invalid email/register number or password.");
        return;
      }
      toast.success("Signed in successfully.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-gradient hidden flex-col justify-between p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg accent-gradient text-accent-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-base font-semibold">Campus Leave</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold">Welcome back.</h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/80">
            Students, sub-admins and administrators all sign in here — you will land on the
            dashboard that matches your role.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Your session is secured and your data is visible only to you.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className="surface-card w-full max-w-md space-y-5 p-7">
          <div>
            <h1 className="font-display text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your email address or register number.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Email or register number</Label>
            <Input
              id="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@college.edu or 23IT101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign in
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New student?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
