import { z } from "zod";

export const createFaqSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});
export const updateFaqSchema = z.object({
  question: z.string().min(3).optional(),
  answer: z.string().min(3).optional(),
});
