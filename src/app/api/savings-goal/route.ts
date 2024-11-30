import {
  createSavingsGoal,
  getSavingsGoal,
} from "@/controllers/savings.controller";

export const GET = getSavingsGoal;
export const POST = createSavingsGoal;
