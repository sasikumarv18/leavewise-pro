import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
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
import {
  fetchAllStudentsDirectory,
  fetchLeaves,
  formatDate,
  LEAVE_TYPE_LABEL,
  STUDENT_TYPE_LABEL,
} from "@/lib/queries";

export const Route = createFileRoute("/admin/leaves")({
  head: () => ({
    meta: [
      { title: "All Leave Applications — Campus Leave" },
      {
        name: "description",
        content:
          "Browse, filter and export every leave application submitted across departments and classes.",
      },
      { property: "og:title", content: "All Leave Applications — Campus Leave" },
      { property: "og:description", content: "Complete college-wide leave application register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLeaves,
});

function AdminLeaves() {
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [term, setTerm] = useState("");

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
      if (type !== "ALL" && r.leave_type !== type) return false;
      if (!q) return true;
      const s = studentById.get(r.student_id);
      return (
        r.application_number.toLowerCase().includes(q) ||
        (s?.register_number ?? "").toLowerCase().includes(q) ||
        (s?.profile?.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [leaves.data, status, type, term, studentById]);

  function exportCsv() {
    const header = [
      "Application ID",
      "Student",
      "Register Number",
      "Student Type",
      "Leave Type",
      "From",
      "To",
      "Days",
      "Status",
      "Reason",
    ];
    const lines = rows.map((r) => {
      const s = studentById.get(r.student_id);
      return [
        r.application_number,
        s?.profile?.full_name ?? "",
        s?.register_number ?? "",
        s ? STUDENT_TYPE_LABEL[s.student_type] : "",
        LEAVE_TYPE_LABEL[r.leave_type],
        r.start_date,
        r.end_date,
        String(r.number_of_days),
        r.status,
        r.reason.replace(/\s+/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      role="ADMIN"
      title="Leave applications"
      description="Complete register of every application"
    >
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search student, register number or application ID"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-44">
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
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All leave types</SelectItem>
              <SelectItem value="MEDICAL">Medical</SelectItem>
              <SelectItem value="PERSONAL">Personal</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </div>

        {leaves.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            No applications match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Application</th>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Days</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = studentById.get(r.student_id);
                  return (
                    <tr key={r.id} className="border-t border-border/70">
                      <td className="px-5 py-3 font-mono text-xs">{r.application_number}</td>
                      <td className="px-5 py-3">
                        <span className="font-medium">{s?.profile?.full_name ?? "—"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s?.register_number ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">{LEAVE_TYPE_LABEL[r.leave_type]}</td>
                      <td className="px-5 py-3">
                        {formatDate(r.start_date)} → {formatDate(r.end_date)}
                      </td>
                      <td className="px-5 py-3">{r.number_of_days}</td>
                      <td className="px-5 py-3">
                        <StatusBadge value={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
