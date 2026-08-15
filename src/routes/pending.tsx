import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { myStaffRequest } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Approval Pending — Campus Leave" },
      {
        name: "description",
        content:
          "Track the status of your administrator or sub-admin account request while it awaits approval.",
      },
      { property: "og:title", content: "Approval Pending — Campus Leave" },
      { property: "og:description", content: "Your staff account request status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { session, loading, signOut } = useAuth();
  const req = useQuery({
    queryKey: ["my-staff-request"],
    queryFn: () => myStaffRequest(),
    enabled: Boolean(session),
  });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const data = req.data?.request ?? null;

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="surface-card w-full max-w-md p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Clock className="size-5" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Account awaiting approval</h1>

        {!session ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to check the status of your staff account request.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </>
        ) : req.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking your request…</p>
        ) : data ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {data.requested_role === "ADMIN" ? "Administrator" : "Sub-Admin"} access
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested {new Date(data.created_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {data.status === "PENDING"
                ? "An administrator will review your request shortly. You will be able to sign in to your dashboard once it is approved."
                : data.status === "APPROVED"
                  ? "Your request was approved. Sign out and sign back in to load your dashboard."
                  : `Your request was rejected.${data.review_remark ? ` Reason: ${data.review_remark}` : ""}`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => void signOut()}>
                Sign out
              </Button>
              <Button className="flex-1" onClick={() => void req.refetch()}>
                Refresh status
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account has no role assigned yet. If you are staff, submit a staff account
              request; students should register through the student form.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to="/staff-register">Staff registration</Link>
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
