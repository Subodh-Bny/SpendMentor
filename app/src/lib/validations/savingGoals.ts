import { z } from "zod";

export const savingsGoalSchema = z.object({
  targetAmount: z.string().min(1, "Target amount is required"),
  currentAmount: z.string().min(1, "Current amount is required"),
});
