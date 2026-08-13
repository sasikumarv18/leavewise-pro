import { supabase } from "@/integrations/supabase/client";

export type LeaveRow = {
  id: string;
  application_number: string;
  student_id: string;
  leave_type: "MEDICAL" | "PERSONAL" | "EMERGENCY" | "OTHER";
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  attachment_path: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submitted_at: string;
  reviewed_at: string | null;
  review_remark: string | null;
};

export type StudentRow = {
  id: string;
  user_id: string;
  register_number: string;
  student_type: "HOSTELLER" | "DAY_SCHOLAR";
  department_id: string;
  class_id: string;
  created_at: string;
};

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  MEDICAL: "Medical Leave",
  PERSONAL: "Personal Leave",
  EMERGENCY: "Emergency Leave",
  OTHER: "Other",
};

export const STUDENT_TYPE_LABEL: Record<string, string> = {
  HOSTELLER: "Hosteller",
  DAY_SCHOLAR: "Day Scholar",
};

export async function fetchDepartments() {
  const res = await supabase.from("departments").select("id, department_name, code").order("department_name");
  if (res.error) throw res.error;
  return res.data;
}

export async function fetchClasses() {
  const res = await supabase.from("classes").select("id, class_name, department_id").order("class_name");
  if (res.error) throw res.error;
  return res.data;
}

export async function fetchMyStudent(userId: string) {
  const res = await supabase
    .from("students")
    .select("id, user_id, register_number, student_type, department_id, class_id, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (res.error) throw res.error;
  return res.data as StudentRow | null;
}

export async function fetchLeaves(studentId?: string) {
  let q = supabase
    .from("leave_applications")
    .select(
      "id, application_number, student_id, leave_type, start_date, end_date, number_of_days, reason, attachment_path, status, submitted_at, reviewed_at, review_remark",
    )
    .order("submitted_at", { ascending: false });
  if (studentId) q = q.eq("student_id", studentId);
  const res = await q;
  if (res.error) throw res.error;
  return res.data as LeaveRow[];
}

export async function fetchAllStudentsDirectory() {
  const [students, profiles] = await Promise.all([
    supabase
      .from("students")
      .select("id, user_id, register_number, student_type, department_id, class_id, created_at"),
    supabase.from("profiles").select("id, full_name, email, status"),
  ]);
  if (students.error) throw students.error;
  if (profiles.error) throw profiles.error;
  const profileById = new Map(profiles.data.map((p) => [p.id, p]));
  return (students.data as StudentRow[]).map((s) => ({
    ...s,
    profile: profileById.get(s.user_id) ?? null,
  }));
}

export type LeaveStats = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  cancelled: number;
  approvedDays: number;
  rejectedDays: number;
  pendingDays: number;
};

export function computeStats(rows: LeaveRow[]): LeaveStats {
  const sum = (s: LeaveRow["status"]) =>
    rows.filter((r) => r.status === s).reduce((a, r) => a + r.number_of_days, 0);
  const count = (s: LeaveRow["status"]) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    approved: count("APPROVED"),
    rejected: count("REJECTED"),
    pending: count("PENDING"),
    cancelled: count("CANCELLED"),
    approvedDays: sum("APPROVED"),
    rejectedDays: sum("REJECTED"),
    pendingDays: sum("PENDING"),
  };
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
