import {
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/controllers/expense.controller";

const GET = getExpenses;
const DELETE = deleteExpense;
const PUT = updateExpense;

export { GET, PUT, DELETE };
