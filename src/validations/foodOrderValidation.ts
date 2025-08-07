import { z } from "zod";

const itemsSchema = z
  .array(
    z.object({
      item: z.string().min(1, "Item label is required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      notes: z.string().optional(),
    })
  )
  .min(1, "At least one item is required");

export const createFoodOrderSchema = z.object({
  menuId: z.string().uuid(),
  additionalNotes: z.string().optional(),
  items: itemsSchema,
});

export const updateFoodOrderSchema = z.object({
  menuId: z.string().uuid().optional(),
  items: itemsSchema.optional(),
  comment: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const updateAdminFoodOrderSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected"], {
    required_error: "Status is required",
  }),
  price: z.string().optional(),
  items: itemsSchema.optional(),
});
