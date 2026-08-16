import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listStaffRequests, reviewStaffRequest } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({
    meta: [
      { title: "Staff Access Requests — Campus Leave" },
      {
        name: "description",
        content:
          "Approve or reject administrator and sub-admin account requests before staff can access the leave portal.",
      },
      { property: "og:title", content: "Staff Access Requests — Campus Leave" },
      { property: "og:description", content: "Review pending staff account requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRequests,
});

type Row = Awaited<ReturnType<typeof listStaffRequests>>["requests"][number];

function AdminRequests() {
  const qc = useQueryClient();
  const [review, setReview] = useState<{ row: Row; decision: "APPROVED" | "REJECTED" } | null>(null);
  const [remark, setRemark] = useState("");

  const requests = useQuery({
    queryKey: ["staff-requests"],
    queryFn: () => listStaffRequests(),
  });

  const decide = useMutation({
    mutationFn: (input: { requestId: string; decision: "APPROVED" | "REJECTED"; remark?: string }) =>
      reviewStaffRequest({ data: input }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Request reviewed.");
      setReview(null);
      setRemark("");
      void qc.invalidateQueries({ queryKey: ["staff-requests"] });
      void qc.invalidateQueries({ queryKey: ["subadmins"] });
    },
    onError: () => toast.error("The request could not be reviewed."),
  });

  const rows = requests.data?.requests ?? [];
  const pending = rows.filter((r) => r.status === "PENDING");

  return (
    <AppShell
      role="ADMIN"
      title="Staff access requests"
      description="Approve or reject admin and sub-admin account applications"
    >
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold">Applications</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {pending.length} pending
          </span>
        </div>

        {requests.isLoading ? (
          <div className="grid place-items-center py-14">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center gap-2 py-14 text-center">
            <UserCheck className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No staff account requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Applicant</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {r.requested_role === "ADMIN" ? "Administrator" : "Sub-Admin"}
                    </td>
                    <td className="max-w-[220px] px-5 py-3 text-xs text-muted-foreground">
                      {r.message ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRemark("");
                              setReview({ row: r, decision: "APPROVED" });
                            }}
                          >
                            <Check className="mr-1 size-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRemark("");
                              setReview({ row: r, decision: "REJECTED" });
                            }}
                          >
                            <X className="mr-1 size-4" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.review_remark ?? "Reviewed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(review)} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {review?.decision === "APPROVED" ? "Approve request" : "Reject request"}
            </DialogTitle>
            <DialogDescription>
              {review?.row.full_name} requested{" "}
              {review?.row.requested_role === "ADMIN" ? "Administrator" : "Sub-Admin"} access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remark">
              Remark {review?.decision === "REJECTED" ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="remark"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>
              Cancel
            </Button>
            <Button
              disabled={decide.isPending || (review?.decision === "REJECTED" && !remark.trim())}
              onClick={() =>
                review &&
                decide.mutate({
                  requestId: review.row.id,
                  decision: review.decision,
                  ...(remark.trim() ? { remark: remark.trim() } : {}),
                })
              }
            >
              {decide.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
