import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Amount cannot be negative",
  }),
  date: z.date(),
  category: z.string().min(1, "Category is required"),
  newCategory: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
