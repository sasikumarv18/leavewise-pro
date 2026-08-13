import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileClock, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchLeaves, fetchMyStudent, formatDate, LEAVE_TYPE_LABEL } from "@/lib/queries";

export const Route = createFileRoute("/student/leaves")({
  head: () => ({
    meta: [
      { title: "My Leave History — Campus Leave" },
      {
        name: "description",
        content:
          "Review every leave application you have submitted, its approval status and reviewer remarks.",
      },
      { property: "og:title", content: "My Leave History — Campus Leave" },
      { property: "og:description", content: "Full history of your leave applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyLeaves,
});

function MyLeaves() {
  const { userId } = useAuth();
  const [status, setStatus] = useState("ALL");
  const [term, setTerm] = useState("");

  const student = useQuery({
    queryKey: ["my-student", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyStudent(userId!),
  });
  const leaves = useQuery({
    queryKey: ["my-leaves", student.data?.id],
    enabled: Boolean(student.data?.id),
    queryFn: () => fetchLeaves(student.data!.id),
  });

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (leaves.data ?? []).filter(
      (r) =>
        (status === "ALL" || r.status === status) &&
        (q === "" ||
          r.application_number.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)),
    );
  }, [leaves.data, status, term]);

  async function openDocument(path: string) {
    const { data } = await supabase.storage.from("leave-documents").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <AppShell role="STUDENT" title="My leave history" description="All applications you submitted">
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by application ID or reason"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {leaves.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FileClock className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No applications found</p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/student/apply">Apply for leave</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {r.application_number}
                    </p>
                    <p className="mt-0.5 font-medium">
                      {LEAVE_TYPE_LABEL[r.leave_type]} · {r.number_of_days}{" "}
                      {r.number_of_days === 1 ? "day" : "days"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(r.start_date)} → {formatDate(r.end_date)}
                    </p>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
                <p className="mt-3 text-sm text-foreground/90">{r.reason}</p>
                {r.review_remark && (
                  <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span className="font-medium">Reviewer remark: </span>
                    {r.review_remark}
                  </p>
                )}
                {r.attachment_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void openDocument(r.attachment_path!)}
                  >
                    <Download className="mr-2 size-4" /> Supporting document
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
