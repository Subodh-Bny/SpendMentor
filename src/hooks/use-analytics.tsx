import { useGetAnalytics } from "@/services/api/analyticsApi";

export const useGetMonthlyExpenses = (
  month: number, // Pass zero-indexed month
  year: number
): IExpense[] => {
  const { data: financialData, isLoading, error } = useGetAnalytics();

  if (isLoading || error || !financialData) return [];

  return financialData.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() === month && expenseDate.getFullYear() === year
    );
  });
};

export const useGetYearlyExpenses = (year: number): IExpense[] => {
  const { data: financialData, isLoading, error } = useGetAnalytics();

  if (isLoading || error || !financialData) return [];

  return financialData.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === year;
  });
};

export const useGetCategoryTotal = (
  expenses: IExpense[]
): Record<string, number> => {
  return expenses.reduce((acc, expense) => {
    const categoryName =
      typeof expense.category === "string"
        ? expense.category
        : expense.category.name;
    acc[categoryName] = (acc[categoryName] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);
};

export const useGetTotalExpenses = (expenses: IExpense[]): number => {
  return expenses.reduce(
    (total, expense) => total + parseFloat(expense.amount),
    0
  );
};

export const useGetCategories = (): ICategory[] => {
  const { data: financialData, isLoading, error } = useGetAnalytics();

  if (isLoading || error || !financialData) return [];

  return financialData.categories;
};

export const useGetMonthlyBudget = (month: number): number => {
  const { data: financialData, isLoading, error } = useGetAnalytics();

  if (isLoading || error || !financialData) return 0;

  return financialData.budgets.reduce((acc, budget) => {
    const budgetMonth = new Date(budget.month).getMonth();
    return budgetMonth === month ? acc + budget.amount : acc + 0;
  }, 0);
};
