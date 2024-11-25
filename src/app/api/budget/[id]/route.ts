import {
  getBudgetById,
  deleteBudget,
  updateBudget,
} from "@/controllers/budget.controller";

const GET = getBudgetById;
const DELETE = deleteBudget;
const PUT = updateBudget;

export { GET, PUT, DELETE };
