import { z } from "zod";

export const savingsGoalSchema = z.object({
  targetAmount: z
    .string()
    .min(1, "Target amount is required")
    .refine((val) => parseFloat(val) > 0, {
      message: "Target amount cannot be negative",
    }),
  currentAmount: z
    .string()
    .min(1, "Current amount is required")
    .refine((val) => parseFloat(val) > 0, {
      message: "Current amount cannot be negative",
    }),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
