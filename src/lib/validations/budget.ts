import { z } from "zod";

const budgetSchema = z.object({
  id: z.string().optional(),
  amount: z.number().min(10, "Budget should be more than 10"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid date format. Use YYYY-MM"),
});

export default budgetSchema;
