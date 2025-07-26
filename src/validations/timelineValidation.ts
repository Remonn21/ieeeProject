import { z } from "zod";

export const eventSessionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  speakerId: z.string().min(1),
});

export const addEventDaySchema = z.object({
  date: z.coerce.date(),
  label: z.string(),
});
