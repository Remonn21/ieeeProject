import { z } from "zod";

export const createBoardMemberSchema = z.object({
  position: z.enum(["counselor", "excom", "head", "vice"]),

  title: z.string().min(1, "Title is required"),
  name: z.string().min(1, "Name is required"),

  socialLinks: z.array(z.string().url("Each social link must be a valid URL")).optional(),

  userId: z.string().uuid("Invalid user ID").optional(),

  committeeId: z.string().uuid("Invalid committee ID").optional(),
});
