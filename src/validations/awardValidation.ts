import { z } from "zod";

export const createAwardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  winningDate: z.coerce.date(),
  image: z.any(),
  place: z.string(),
});
