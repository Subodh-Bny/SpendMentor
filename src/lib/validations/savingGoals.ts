import { z } from "zod";

export const savingsGoalSchema = z.object({
  action: z.enum(["set", "update"], {
    required_error: "Please select an action.",
  }),
  targetAmount: z
    .string()
    .min(1, {
      message: "Target amount is required.",
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number.",
    }),
  currentAmount: z
    .string()
    .min(1, {
      message: "Current amount is required.",
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Current amount must be a non-negative number.",
    }),
  targetDate: z
    .date({
      required_error: "Target date is required.",
    })
    .optional(),
  updateAmount: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "Update amount must be a non-negative number.",
    }),
});
