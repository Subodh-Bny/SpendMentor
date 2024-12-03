const routes = {
  auth: { signUp: "/auth/signup", login: "/auth/login" },
  dashboard: {
    home: "/dashboard",
    expenses: "/dashboard/expenses",
    budget: { overview: "/dashboard/budget/", new: "/dashboard/budget/new" },
    goals: "/dashboard/goals",
    categories: "/dashboard/categories",
  },
  settings: "/settings",
};

export default routes;
