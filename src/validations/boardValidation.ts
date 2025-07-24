import { z } from "zod";

export const createBoardMemberSchema = z.object({
  position: z.enum(["counselor", "excom", "head", "vice"]),
  title: z.string().min(1, "Title is required"),
  name: z.string().min(1, "Name is required"),

  socialLinks: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (e) {
          return undefined; // Will trigger validation error
        }
      }
      return val;
    },
    z
      .array(
        z.object({
          url: z.string().url("Invalid URL"),
          name: z.string(),
          icon: z.string(),
        })
      )
      .min(1, "At least one social link is required")
  ),

  userId: z.string().uuid("Invalid user ID").optional(),
  committeeId: z.string().uuid("Invalid committee ID").optional(),
});
