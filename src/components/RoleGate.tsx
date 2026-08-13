import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth, homeForRole, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function RoleGate({ allow, children }: { allow: AppRole; children: ReactNode }) {
  const { loading, session, role, profile } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <Message
        title="Please sign in"
        body="You need to be signed in to view this page."
        actionLabel="Go to login"
        to="/auth"
      />
    );
  }

  if (profile?.status === "INACTIVE") {
    return (
      <Message
        title="Account deactivated"
        body="Your account has been deactivated. Please contact the college administrator."
        actionLabel="Back to home"
        to="/"
      />
    );
  }

  if (role !== allow) {
    return (
      <Message
        title="Access denied"
        body="You do not have permission to access this page."
        actionLabel="Go to my dashboard"
        to={homeForRole(role)}
      />
    );
  }

  return <>{children}</>;
}

function Message({
  title,
  body,
  actionLabel,
  to,
}: {
  title: string;
  body: string;
  actionLabel: string;
  to: string;
}) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="surface-card max-w-md p-8 text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button asChild className="mt-6">
          <Link to={to}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
