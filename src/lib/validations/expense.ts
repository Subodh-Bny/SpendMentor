import { z } from "zod";

export const expenseSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  amount: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Amount must be a valid number",
  }),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
