import { z } from "zod";

export const eventSessionSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format"),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format")
      .optional(),
    speakerId: z.string().min(1),
  })
  .refine(
    (data) => {
      if (!data.endTime) return true;

      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      return endTotal > startTotal;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const addEventDaySchema = z.object({
  date: z.coerce.date(),
  label: z.string(),
});

export const updateEventDaySchema = z.object({
  date: z.coerce.date().optional(),
  label: z.string().optional(),
});
