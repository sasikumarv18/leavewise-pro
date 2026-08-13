import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMyStudent } from "@/lib/queries";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, daysBetween, leaveSchema } from "@/lib/validation";

export const Route = createFileRoute("/student/apply")({
  head: () => ({
    meta: [
      { title: "Apply for Leave — Campus Leave" },
      {
        name: "description",
        content:
          "Submit a medical, personal, emergency or other leave request with automatic day calculation and optional supporting document.",
      },
      { property: "og:title", content: "Apply for Leave — Campus Leave" },
      { property: "og:description", content: "Submit a new leave application." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyLeave,
});

function ApplyLeave() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [leaveType, setLeaveType] = useState("MEDICAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const student = useQuery({
    queryKey: ["my-student", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyStudent(userId!),
  });

  const days = daysBetween(startDate, endDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leaveSchema.safeParse({ leaveType, startDate, endDate, reason });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    if (!student.data) {
      toast.error("Your student record could not be loaded.");
      return;
    }
    if (file) {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        toast.error("Only PDF, JPG, PNG or WEBP documents are allowed.");
        return;
      }
      if (file.size > MAX_DOC_BYTES) {
        toast.error("The supporting document must be smaller than 5 MB.");
        return;
      }
    }
    setErrors({});
    setBusy(true);
    try {
      let attachmentPath: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const safeName = `${userId}/${crypto.randomUUID()}.${ext}`;
        const upload = await supabase.storage
          .from("leave-documents")
          .upload(safeName, file, { contentType: file.type, upsert: false });
        if (upload.error) {
          toast.error("The supporting document could not be uploaded.");
          return;
        }
        attachmentPath = safeName;
      }

      const res = await supabase
        .from("leave_applications")
        .insert({
          // application_number, number_of_days and status are set by a DB trigger
          application_number: "",
          student_id: student.data.id,
          leave_type: parsed.data.leaveType,
          start_date: parsed.data.startDate,
          end_date: parsed.data.endDate,
          number_of_days: days,
          reason: parsed.data.reason,
          attachment_path: attachmentPath,
        })
        .select("application_number")
        .single();

      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`Leave application submitted successfully. ID: ${res.data.application_number}`);
      void navigate({ to: "/student/leaves" });
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell
      role="STUDENT"
      title="Apply for leave"
      description="Complete the form below — days are calculated automatically."
    >
      <form onSubmit={handleSubmit} className="surface-card mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Leave type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICAL">Medical Leave</SelectItem>
                <SelectItem value="PERSONAL">Personal Leave</SelectItem>
                <SelectItem value="EMERGENCY">Emergency Leave</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start">Leave start date</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            {errors["startDate"] && (
              <p className="text-xs font-medium text-destructive">{errors["startDate"]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end">Leave end date</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            {errors["endDate"] && (
              <p className="text-xs font-medium text-destructive">{errors["endDate"]}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Number of days</Label>
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-semibold">
              {days > 0 ? `${days} ${days === 1 ? "Day" : "Days"}` : "Select your dates"}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reason">Reason for leave</Label>
            <Textarea
              id="reason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for your leave request"
            />
            {errors["reason"] && (
              <p className="text-xs font-medium text-destructive">{errors["reason"]}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="doc">Supporting document (optional)</Label>
            <Input
              id="doc"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Paperclip className="size-3" /> PDF, JPG, PNG or WEBP · max 5 MB. Recommended for
              medical leave.
            </p>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CalendarPlus className="mr-2 size-4" />
          )}
          Submit application
        </Button>
      </form>
    </AppShell>
  );
}
