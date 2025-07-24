import { z } from "zod";

export const createInsightSchema = z.object({
  title: z.string().min(1),
  icon: z.string().min(1),
  content: z.string().min(1),
});
