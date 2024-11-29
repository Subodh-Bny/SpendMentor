const user: IUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
};

const categories: ICategory[] = [
  { id: "1", name: "Housing", user: user.id },
  { id: "2", name: "Food", user: user.id },
  { id: "3", name: "Entertainment", user: user.id },
  { id: "4", name: "Transportation", user: user.id },
];

export const financialData: {
  expenses: IExpense[];
  budgets: IBudget[];
  savingsGoal: { target: number; current: number };
} = {
  expenses: [
    {
      id: "1",
      date: new Date("2023-01-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "2",
      date: new Date("2023-01-15"),
      amount: "200",
      category: categories[1],
      user: user.id,
      description: "Groceries",
    },
    {
      id: "3",
      date: new Date("2023-02-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "4",
      date: new Date("2023-02-10"),
      amount: "100",
      category: categories[2],
      user: user.id,
      description: "Movie night",
    },
    {
      id: "5",
      date: new Date("2023-03-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "6",
      date: new Date("2023-03-20"),
      amount: "300",
      category: categories[3],
      user: user.id,
      description: "Car repair",
    },
    {
      id: "7",
      date: new Date("2023-04-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "8",
      date: new Date("2023-04-05"),
      amount: "250",
      category: categories[1],
      user: user.id,
      description: "Dining out",
    },
    {
      id: "9",
      date: new Date("2023-05-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "10",
      date: new Date("2023-05-15"),
      amount: "150",
      category: categories[2],
      user: user.id,
      description: "Concert tickets",
    },
    {
      id: "11",
      date: new Date("2023-06-01"),
      amount: "1500",
      category: categories[0],
      user: user.id,
      description: "Rent",
    },
    {
      id: "12",
      date: new Date("2023-06-25"),
      amount: "400",
      category: categories[3],
      user: user.id,
      description: "New tires",
    },
  ],
  budgets: [
    {
      id: "1",
      category: categories[0],
      amount: 1500,
      month: "2023-01",
      user: user.id,
    },
    {
      id: "2",
      category: categories[1],
      amount: 300,
      month: "2023-01",
      user: user.id,
    },
    {
      id: "3",
      category: categories[2],
      amount: 200,
      month: "2023-01",
      user: user.id,
    },
    {
      id: "4",
      category: categories[3],
      amount: 300,
      month: "2023-01",
      user: user.id,
    },
  ],
  savingsGoal: {
    target: 10000,
    current: 5000,
  },
};

export const getMonthlyExpenses = (month: number, year: number): IExpense[] => {
  return financialData.expenses.filter((expense) => {
    const expenseDate = expense.date;
    return (
      expenseDate.getMonth() === month && expenseDate.getFullYear() === year
    );
  });
};

export const getYearlyExpenses = (year: number): IExpense[] => {
  return financialData.expenses.filter((expense) => {
    const expenseDate = expense.date;
    return expenseDate.getFullYear() === year;
  });
};

export const getCategoryTotal = (
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

export const getTotalExpenses = (expenses: IExpense[]): number => {
  return expenses.reduce(
    (total, expense) => total + parseFloat(expense.amount),
    0
  );
};

export const getCategories = (): ICategory[] => {
  return categories;
};

export const getMonthlyBudget = (month: string): IBudget[] => {
  return financialData.budgets.filter((budget) => budget.month === month);
};
