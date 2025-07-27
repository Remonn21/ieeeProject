import { z } from "zod";

const allowedRoles = ["MEMBER", "EXCOM", "HEAD"] as const;

const userFields = {
  name: z.string().min(1, "name is required"),
  email: z.string().email("Invalid email"),
  personalEmail: z.string().email("Invalid personal email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(6, "Phone must be at least 6 characters"),
  nationalId: z.string().optional(),
  role: z.enum(allowedRoles, { required_error: "Role is required" }),
  committeeId: z.string().uuid("Invalid committee ID").optional(),
};

const memberProfileFields = {
  university: z.string().min(1, "University is required"),
  faculty: z.string().min(1, "Faculty is required"),
  ieeeId: z.string().optional(),
};

export const createMemberSchema = z.object({
  ...userFields,
  ...memberProfileFields,
});

const makeOptional = <T extends Record<string, z.ZodTypeAny>>(schemaFields: T) => {
  return Object.fromEntries(
    Object.entries(schemaFields).map(([key, val]) => [key, val.optional()])
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
};

export const updateMemberSchema = z.object({
  ...makeOptional(userFields),
  ...makeOptional(memberProfileFields),
});
