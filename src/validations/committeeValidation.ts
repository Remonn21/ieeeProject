import { z } from "zod";

export const topicsSchema = z.preprocess(
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
        title: z.string().min(1, "Topic title is required"),
        content: z.string().min(1, "Topic content is required"),
      })
    )
    .min(1, "At least one topic is required")
);

const baseCommitteeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  topics: topicsSchema,
  headIds: z.preprocess(
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
    z.array(z.string()).min(1, "At least one head is required")
  ),
});

export const createCommitteeSchema = baseCommitteeSchema;

export const updateCommitteeSchema = baseCommitteeSchema.partial();
