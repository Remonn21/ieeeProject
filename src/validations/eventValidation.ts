import { z } from "zod";

// Reusable enum
const formFieldTypeEnum = z.enum(["TEXT", "EMAIL", "NUMBER", "SELECT", "FILE", "DATE"]);

export const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationStart: z.coerce.date(),
  registrationEnd: z.coerce.date(),
  location: z.string().optional(),
  category: z.enum(["event", "outing", "bootcamp", "workshop"]),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  registrationStart: z.coerce.date().optional(),
  registrationEnd: z.coerce.date().optional(),
  location: z.string().optional(),
  category: z.enum(["event", "outing", "bootcamp", "workshop"]).optional(),
});
