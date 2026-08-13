import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { studentRegistrationSchema, passwordSchema } from "@/lib/validation";
import { z } from "zod";

const subAdminSchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(255),
  password: passwordSchema,
});

/** Public: student self-registration. Creates the auth user + profile + STUDENT role. */
export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => studentRegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const registerNumber = data.registerNumber.trim().toUpperCase();

    const existing = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("register_number", registerNumber)
      .maybeSingle();
    if (existing.data) {
      return { ok: false as const, error: "This register number is already registered." };
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (created.error || !created.data.user) {
      const msg = created.error?.message ?? "Could not create the account.";
      return {
        ok: false as const,
        error: /already/i.test(msg) ? "This email address is already registered." : msg,
      };
    }
    const userId = created.data.user.id;

    const profile = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, full_name: data.fullName, email: data.email.toLowerCase() });
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: profile.error.message };
    }

    const student = await supabaseAdmin.from("students").insert({
      user_id: userId,
      register_number: registerNumber,
      student_type: data.studentType,
      department_id: data.departmentId,
      class_id: data.classId,
    });
    if (student.error) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return {
        ok: false as const,
        error: /duplicate/i.test(student.error.message)
          ? "This register number is already registered."
          : student.error.message,
      };
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "STUDENT" });
    await supabaseAdmin.rpc("log_audit", {
      _actor: userId,
      _action: "STUDENT_REGISTERED",
      _entity: "students",
      _entity_id: userId,
      _details: { register_number: registerNumber },
    });

    return { ok: true as const };
  });

/** Public bootstrap: creates the very first Admin account, only while none exists. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subAdminSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1);
    if ((existing.data?.length ?? 0) > 0) {
      return { ok: false as const, error: "An administrator account already exists." };
    }
    return await createStaffUser("ADMIN", data);
  });

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const res = await supabaseAdmin.from("user_roles").select("id").eq("role", "ADMIN").limit(1);
  return { exists: (res.data?.length ?? 0) > 0 };
});

async function createStaffUser(
  role: "ADMIN" | "SUB_ADMIN",
  data: { fullName: string; email: string; password: string },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const created = await supabaseAdmin.auth.admin.createUser({
    email: data.email.toLowerCase(),
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? "Could not create the account.";
    return {
      ok: false as const,
      error: /already/i.test(msg) ? "This email address is already registered." : msg,
    };
  }
  const userId = created.data.user.id;
  await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, full_name: data.fullName, email: data.email.toLowerCase() });
  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
  return { ok: true as const, userId };
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "ADMIN")
    .maybeSingle();
  if (error || !data) {
    throw new Error("You do not have permission to perform this action.");
  }
}

export const createSubAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const result = await createStaffUser("SUB_ADMIN", data);
    if (result.ok) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.rpc("log_audit", {
        _actor: context.userId,
        _action: "SUB_ADMIN_CREATED",
        _entity: "profiles",
        _entity_id: result.userId,
        _details: { email: data.email },
      });
    }
    return result;
  });

export const updateStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        fullName: z.string().trim().min(3).max(100).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        newPassword: passwordSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.status === "INACTIVE") {
      return { ok: false as const, error: "You cannot deactivate your own account." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: { full_name?: string; status?: "ACTIVE" | "INACTIVE" } = {};
    if (data.fullName) patch.full_name = data.fullName;
    if (data.status) patch.status = data.status;
    if (Object.keys(patch).length > 0) {
      const res = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
      if (res.error) return { ok: false as const, error: res.error.message };
    }
    if (data.newPassword) {
      const res = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        password: data.newPassword,
      });
      if (res.error) return { ok: false as const, error: res.error.message };
    }
    await supabaseAdmin.rpc("log_audit", {
      _actor: context.userId,
      _action: "ACCOUNT_UPDATED",
      _entity: "profiles",
      _entity_id: data.userId,
      _details: { status: data.status ?? null, password_reset: Boolean(data.newPassword) } as never,
    });
    return { ok: true as const };
  });

export const updateStudentRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        studentId: z.string().uuid(),
        registerNumber: z.string().trim().min(4).max(20).optional(),
        studentType: z.enum(["HOSTELLER", "DAY_SCHOLAR"]).optional(),
        departmentId: z.string().uuid().optional(),
        classId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      register_number?: string;
      student_type?: "HOSTELLER" | "DAY_SCHOLAR";
      department_id?: string;
      class_id?: string;
    } = {};
    if (data.registerNumber) patch.register_number = data.registerNumber.toUpperCase();
    if (data.studentType) patch.student_type = data.studentType;
    if (data.departmentId) patch.department_id = data.departmentId;
    if (data.classId) patch.class_id = data.classId;
    const res = await supabaseAdmin.from("students").update(patch).eq("id", data.studentId);
    if (res.error) {
      return {
        ok: false as const,
        error: /duplicate/i.test(res.error.message)
          ? "This register number is already registered."
          : res.error.message,
      };
    }
    await supabaseAdmin.rpc("log_audit", {
      _actor: context.userId,
      _action: "STUDENT_RECORD_UPDATED",
      _entity: "students",
      _entity_id: data.studentId,
      _details: patch as never,
    });
    return { ok: true as const };
  });

export const addDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        departmentName: z.string().trim().min(3).max(120),
        code: z.string().trim().min(2).max(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin
      .from("departments")
      .insert({ department_name: data.departmentName, code: data.code.toUpperCase() });
    if (res.error) return { ok: false as const, error: res.error.message };
    return { ok: true as const };
  });

export const addClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ departmentId: z.string().uuid(), className: z.string().trim().min(2).max(30) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin
      .from("classes")
      .insert({ department_id: data.departmentId, class_name: data.className.toUpperCase() });
    if (res.error) return { ok: false as const, error: res.error.message };
    return { ok: true as const };
  });

/** Admin-only: creates a realistic demo dataset with freshly generated passwords. */
export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateDemoData } = await import("@/lib/seed.server");
    return await generateDemoData(supabaseAdmin, context.userId);
  });

/** Public: resolves a register number to its login email so students can sign in with either. */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ registerNumber: z.string().trim().min(3).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const student = await supabaseAdmin
      .from("students")
      .select("user_id")
      .eq("register_number", data.registerNumber.toUpperCase())
      .maybeSingle();
    if (!student.data) return { email: null as string | null };
    const profile = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", student.data.user_id)
      .maybeSingle();
    return { email: profile.data?.email ?? null };
  });
