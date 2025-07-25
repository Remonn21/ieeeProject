import { z } from "zod";

const positionEnum = z.enum(["counselor", "excom", "head", "vice"]);

const socialLinksSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
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
    .min(1, "at least one social link is required")
);

export const createBoardMemberSchema = z.object({
  position: positionEnum,
  title: z.string().min(1, "Title is required"),
  name: z.string().min(1, "Name is required"),
  socialLinks: socialLinksSchema,
  userId: z.string().uuid("Invalid user ID").optional(),
  committeeId: z.string().uuid("Invalid committee ID").optional(),
});

export const updateBoardMemberSchema = z.object({
  position: positionEnum.optional(),
  title: z.string().min(1, "Title is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  socialLinks: socialLinksSchema.optional(),
  userId: z.string().uuid("Invalid user ID").nullable().optional(),
  committeeId: z.string().uuid("Invalid committee ID").nullable().optional(),
});
