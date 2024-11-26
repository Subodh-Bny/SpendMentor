export const financialData = {
  expenses: [
    { date: "2023-01-01", amount: 1500, category: "Housing" },
    { date: "2023-01-15", amount: 200, category: "Food" },
    { date: "2023-02-01", amount: 1500, category: "Housing" },
    { date: "2023-02-10", amount: 100, category: "Entertainment" },
    { date: "2023-03-01", amount: 1500, category: "Housing" },
    { date: "2023-03-20", amount: 300, category: "Transportation" },
    { date: "2023-04-01", amount: 1500, category: "Housing" },
    { date: "2023-04-05", amount: 250, category: "Food" },
    { date: "2023-05-01", amount: 1500, category: "Housing" },
    { date: "2023-05-15", amount: 150, category: "Entertainment" },
    { date: "2023-06-01", amount: 1500, category: "Housing" },
    { date: "2023-06-25", amount: 400, category: "Transportation" },
  ],
  budget: {
    monthly: 2000,
    categories: {
      Housing: 1500,
      Food: 300,
      Entertainment: 200,
      Transportation: 300,
    },
  },
  savingsGoal: {
    target: 10000,
    current: 5000,
  },
};

export const getMonthlyExpenses = (month: number, year: number) => {
  return financialData.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() === month && expenseDate.getFullYear() === year
    );
  });
};

export const getYearlyExpenses = (year: number) => {
  return financialData.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === year;
  });
};

export const getCategoryTotal = (expenses: typeof financialData.expenses) => {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
};

export const getTotalExpenses = (expenses: typeof financialData.expenses) => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};
