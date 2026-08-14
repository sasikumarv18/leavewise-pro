import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllStudentsDirectory,
  fetchLeaves,
  formatDate,
  LEAVE_TYPE_LABEL,
  STUDENT_TYPE_LABEL,
  type LeaveRow,
} from "@/lib/queries";

export const Route = createFileRoute("/subadmin/requests")({
  head: () => ({
    meta: [
      { title: "Leave Requests — Campus Leave" },
      {
        name: "description",
        content:
          "Approve or reject student leave applications with mandatory remarks and supporting document review.",
      },
      { property: "og:title", content: "Leave Requests — Campus Leave" },
      { property: "og:description", content: "Approve or reject student leave applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaveRequests,
});

function LeaveRequests() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("PENDING");
  const [term, setTerm] = useState("");
  const [target, setTarget] = useState<{ row: LeaveRow; action: "APPROVED" | "REJECTED" } | null>(
    null,
  );
  const [remark, setRemark] = useState("");

  const leaves = useQuery({ queryKey: ["all-leaves"], queryFn: () => fetchLeaves() });
  const students = useQuery({
    queryKey: ["students-directory"],
    queryFn: fetchAllStudentsDirectory,
  });

  const studentById = useMemo(
    () => new Map((students.data ?? []).map((s) => [s.id, s])),
    [students.data],
  );

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (leaves.data ?? []).filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (!q) return true;
      const s = studentById.get(r.student_id);
      return (
        r.application_number.toLowerCase().includes(q) ||
        (s?.register_number ?? "").toLowerCase().includes(q) ||
        (s?.profile?.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [leaves.data, status, term, studentById]);

  const review = useMutation({
    mutationFn: async ({
      row,
      action,
      note,
    }: {
      row: LeaveRow;
      action: "APPROVED" | "REJECTED";
      note: string;
    }) => {
      const res = await supabase
        .from("leave_applications")
        .update({ status: action, review_remark: note.trim() || null })
        .eq("id", row.id);
      if (res.error) throw res.error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Application ${vars.action === "APPROVED" ? "approved" : "rejected"}.`);
      setTarget(null);
      setRemark("");
      void qc.invalidateQueries({ queryKey: ["all-leaves"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openDocument(path: string) {
    const { data } = await supabase.storage.from("leave-documents").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  function submitReview() {
    if (!target) return;
    if (target.action === "REJECTED" && remark.trim().length < 5) {
      toast.error("A rejection reason of at least 5 characters is required.");
      return;
    }
    review.mutate({ row: target.row, action: target.action, note: remark });
  }

  return (
    <AppShell
      role="SUB_ADMIN"
      title="Leave requests"
      description="Approve or reject applications submitted by students"
    >
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by student, register number or application ID"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="ALL">All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {leaves.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            No applications match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const s = studentById.get(r.student_id);
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {r.application_number}
                      </p>
                      <p className="mt-0.5 font-medium">
                        {s?.profile?.full_name ?? "Unknown student"}{" "}
                        <span className="text-muted-foreground">
                          · {s?.register_number ?? "—"} ·{" "}
                          {s ? STUDENT_TYPE_LABEL[s.student_type] : "—"}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {LEAVE_TYPE_LABEL[r.leave_type]} · {formatDate(r.start_date)} →{" "}
                        {formatDate(r.end_date)} · {r.number_of_days}{" "}
                        {r.number_of_days === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <StatusBadge value={r.status} />
                  </div>
                  <p className="mt-3 text-sm text-foreground/90">{r.reason}</p>
                  {r.review_remark && (
                    <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <span className="font-medium">Remark: </span>
                      {r.review_remark}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.attachment_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openDocument(r.attachment_path!)}
                      >
                        <Download className="mr-2 size-4" /> Document
                      </Button>
                    )}
                    {r.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setRemark("");
                            setTarget({ row: r, action: "APPROVED" });
                          }}
                        >
                          <Check className="mr-2 size-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRemark("");
                            setTarget({ row: r, action: "REJECTED" });
                          }}
                        >
                          <X className="mr-2 size-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.action === "APPROVED" ? "Approve application" : "Reject application"}
            </DialogTitle>
            <DialogDescription>
              {target?.row.application_number} · the student is notified immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remark">
              Remark {target?.action === "REJECTED" ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="remark"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={
                target?.action === "REJECTED"
                  ? "Explain why this request is rejected"
                  : "Add a note for the student"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={target?.action === "REJECTED" ? "destructive" : "default"}
              onClick={submitReview}
              disabled={review.isPending}
            >
              {review.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
