import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — Campus Leave" },
      {
        name: "description",
        content:
          "Security audit trail of account changes, leave submissions and approval decisions across the system.",
      },
      { property: "og:title", content: "Audit Log — Campus Leave" },
      { property: "og:description", content: "System-wide security audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditLog,
});

const ACTION_LABEL: Record<string, string> = {
  STUDENT_REGISTERED: "Student registered",
  SUB_ADMIN_CREATED: "Sub-admin created",
  ADMIN_BOOTSTRAP: "Administrator created",
  ACCOUNT_UPDATED: "Account updated",
  STUDENT_RECORD_UPDATED: "Student record updated",
  LEAVE_SUBMITTED: "Leave submitted",
  LEAVE_APPROVED: "Leave approved",
  LEAVE_REJECTED: "Leave rejected",
  DEMO_DATA_SEEDED: "Demo data generated",
};

async function fetchAudit() {
  const res = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (res.error) throw res.error;
  return res.data;
}

function AuditLog() {
  const logs = useQuery({ queryKey: ["audit-logs"], queryFn: fetchAudit });

  return (
    <AppShell role="ADMIN" title="Audit log" description="Latest 200 recorded system events">
      <div className="surface-card overflow-hidden">
        {logs.isLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (logs.data ?? []).length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ScrollText className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(logs.data ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{ACTION_LABEL[l.action] ?? l.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.entity ?? "system"}
                    {l.details ? ` · ${JSON.stringify(l.details).slice(0, 120)}` : ""}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
