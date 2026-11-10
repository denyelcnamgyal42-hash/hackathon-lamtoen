import { z } from "zod";

export const ROLES = ["founder", "mentor", "admin"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ACCOUNT_STATES = ["active", "suspended"] as const;
export const accountStateSchema = z.enum(ACCOUNT_STATES);
export type AccountState = z.infer<typeof accountStateSchema>;

/** Assigned by the server during public registration. Never read from the client. */
export const PUBLIC_SIGNUP_ROLE = "founder" as const satisfies Role;

export const emailSchema = z
  .string()
  .trim()
  .min(3, { message: "Enter a valid email address." })
  .max(254, { message: "Email must be at most 254 characters." })
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Enter a valid email address.",
  });

export const passwordSchema = z
  .string()
  .min(10, { message: "Password must be at least 10 characters." })
  .max(128, { message: "Password must be at most 128 characters." })
  .regex(/[A-Za-z]/, { message: "Password must include a letter." })
  .regex(/[0-9]/, { message: "Password must include a number." });

export const registerRequestSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(80, { message: "Name must be at most 80 characters." }),
    email: emailSchema,
    password: passwordSchema,
  })
  .superRefine((value, ctx) => {
    if (value.password.toLowerCase() === value.email.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must not be the same as your email.",
      });
    }
  });

export const loginRequestSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string()
    .min(1, { message: "Enter your password." })
    .max(128, { message: "Password must be at most 128 characters." }),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountState: AccountState;
  createdAt: string;
}

export interface AuthSessionResponse {
  user: PublicUser;
  csrfToken: string;
}

/** Phase 1 has no venture, mentorship, or research records. Null is the real value. */
export interface FounderWorkspace {
  profile: PublicUser;
  venture: null;
  mentorship: null;
  research: null;
}

export interface AdminSummary {
  counts: {
    founders: number;
    mentors: number;
    admins: number;
    suspended: number;
  };
}

export interface FieldErrorMap {
  [field: string]: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: {
      fields?: FieldErrorMap;
    };
  };
}

export function firstFieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): FieldErrorMap {
  const fields: FieldErrorMap = {};
  for (const issue of error.issues) {
    const key = issue.path.length === 0 ? "form" : issue.path.map((part) => String(part)).join(".");
    if (fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export const PRIVILEGE_FIELDS = [
  "role",
  "roles",
  "accountState",
  "passwordHash",
  "isAdmin",
  "verified",
  "mentorVerified",
] as const;

export function privilegeFieldPresent(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return PRIVILEGE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field));
}
