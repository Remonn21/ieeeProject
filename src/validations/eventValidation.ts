import { z } from "zod";

// Reusable enum
const formFieldTypeEnum = z.enum(["TEXT", "EMAIL", "NUMBER", "SELECT", "FILE", "DATE"]);

// Speaker schema
const speakerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  title: z.string().min(2),
  job: z.string().optional(),
  company: z.string().optional(),
  photoUrl: z.string().url().optional(),
  category: z.enum(["event", "outing", "bootcamp", "workshop"]).optional(),
  socialLinks: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (e) {
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
      .min(1, "At least one social link is required")
  ),

  description: z.string().optional(),
});

// Form field schema
const formFieldSchema = z.object({
  label: z.string().min(1),
  name: z.string().min(1),
  type: formFieldTypeEnum,
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

const agendaItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  speakerName: z.string().min(1),
});

const timelineDaySchema = z.object({
  date: z.string().datetime(),
  label: z.string().optional(),
  agenda: z.array(agendaItemSchema),
});

export const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationStart: z.string().datetime(),
  registrationEnd: z.string().datetime(),
  location: z.string().optional(),
  category: z.enum(["event", "outing", "bootcamp", "workshop"]),
  // speakers: z.array(speakerSchema).optional().default([]),
  // formFields: z.array(formFieldSchema).optional().default([]),
  // timeline: z.array(timelineDaySchema).optional().default([]),
});
