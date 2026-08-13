import { z } from "zod";

export const DEPARTMENT_FALLBACK = "Information Technology";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerNumberSchema = z
  .string()
  .trim()
  .min(4, "Register number is too short")
  .max(20, "Register number is too long")
  .regex(/^[A-Za-z0-9-]+$/, "Register number may only contain letters, numbers and hyphens");

export const studentRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(3, "Full name is required").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    registerNumber: registerNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    studentType: z.enum(["HOSTELLER", "DAY_SCHOLAR"]),
    departmentId: z.string().uuid("Select a department"),
    classId: z.string().uuid("Select a class"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;

export const leaveSchema = z
  .object({
    leaveType: z.enum(["MEDICAL", "PERSONAL", "EMERGENCY", "OTHER"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(5, "Please give a reason (min 5 characters)").max(1000),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "Leave end date cannot be earlier than start date.",
    path: ["endDate"],
  });

export const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const diff = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return diff > 0 ? diff : 0;
}
