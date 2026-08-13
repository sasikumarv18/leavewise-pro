import type { SupabaseClient } from "@supabase/supabase-js";

function password(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return (
    Array.from(bytes, (b) => chars[b % chars.length]).join("") + "7a"
  );
}

const DEMO_STUDENTS = [
  { name: "Rahul Kumar", reg: "23IT101", type: "HOSTELLER", dept: "IT", cls: "IT-A" },
  { name: "Priya Sharma", reg: "23IT118", type: "DAY_SCHOLAR", dept: "IT", cls: "IT-B" },
  { name: "Arun Prakash", reg: "23CSE204", type: "HOSTELLER", dept: "CSE", cls: "CSE-A" },
  { name: "Divya Menon", reg: "23ECE311", type: "DAY_SCHOLAR", dept: "ECE", cls: "ECE-A" },
  { name: "Karthik Raja", reg: "23MECH402", type: "HOSTELLER", dept: "MECH", cls: "MECH-B" },
  { name: "Sneha Iyer", reg: "23CIVIL512", type: "DAY_SCHOLAR", dept: "CIVIL", cls: "CIVIL-A" },
] as const;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function generateDemoData(admin: SupabaseClient<any>, actorId: string) {
  const credentials: { role: string; name: string; email: string; password: string }[] = [];

  const depts = await admin.from("departments").select("id, code");
  const classes = await admin.from("classes").select("id, class_name");
  const deptByCode = new Map((depts.data ?? []).map((d: any) => [d.code, d.id]));
  const classByName = new Map((classes.data ?? []).map((c: any) => [c.class_name, c.id]));

  async function createUser(name: string, email: string, role: string) {
    const pass = password();
    const created = await admin.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (created.error || !created.data.user) return null;
    const id = created.data.user.id;
    await admin.from("profiles").insert({ id, full_name: name, email });
    await admin.from("user_roles").insert({ user_id: id, role });
    credentials.push({ role, name, email, password: pass });
    return id;
  }

  const stamp = Date.now().toString().slice(-5);
  await createUser("Meera Subramanian", `subadmin.${stamp}@demo.college.edu`, "SUB_ADMIN");

  const leaveTypes = ["MEDICAL", "PERSONAL", "EMERGENCY", "OTHER"] as const;
  let seq = 0;

  for (const s of DEMO_STUDENTS) {
    const email = `${s.reg.toLowerCase()}.${stamp}@demo.college.edu`;
    const userId = await createUser(s.name, email, "STUDENT");
    if (!userId) continue;
    const inserted = await admin
      .from("students")
      .insert({
        user_id: userId,
        register_number: `${s.reg}-${stamp}`,
        student_type: s.type,
        department_id: deptByCode.get(s.dept),
        class_id: classByName.get(s.cls),
      })
      .select("id")
      .single();
    const studentId = inserted.data?.id;
    if (!studentId) continue;

    const count = 2 + (seq % 3);
    for (let i = 0; i < count; i++) {
      seq++;
      const start = -30 + seq * 3;
      const status =
        i === 0 ? "PENDING" : seq % 4 === 0 ? "REJECTED" : ("APPROVED" as const);
      await admin.from("leave_applications").insert({
        student_id: studentId,
        leave_type: leaveTypes[seq % leaveTypes.length],
        start_date: isoDate(start),
        end_date: isoDate(start + (seq % 3)),
        number_of_days: 1,
        reason:
          status === "REJECTED"
            ? "Family function at hometown, requesting leave."
            : "Medical consultation and rest advised by the college physician.",
        status,
        review_remark:
          status === "PENDING"
            ? null
            : status === "REJECTED"
              ? "Insufficient notice period. Please reapply with documents."
              : "Approved. Kindly submit the medical certificate on return.",
        reviewed_at: status === "PENDING" ? null : new Date().toISOString(),
      });
    }
  }

  await admin.rpc("log_audit", {
    _actor: actorId,
    _action: "DEMO_DATA_SEEDED",
    _entity: "system",
    _entity_id: null,
    _details: { accounts: credentials.length },
  });

  return { ok: true as const, credentials };
}
