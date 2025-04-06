import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  role: z.enum(["ATTENDEE", "MEMBER", "HEAD", "EXCOM"]),
  faculty: z.string(),
  university: z.string(),
  //   committeeId: z.string().uuid(),
});
