"use client";

import { BudgetForm } from "@/components/budget/budget-form";
import { useSetBudget } from "@/services/api/budgetApi";
import LoadingPopup from "@/components/loading-popup";
import { useRouter } from "next/navigation";
import routes from "@/config/routes";

export default function NewBudgetPage() {
  const { mutate: setBudget, isPending: setBudgetPending } = useSetBudget();
  const router = useRouter();
  const handleSubmit = (budgetData: Omit<IBudget, "id" | "spent">) => {
    setBudget(budgetData, {
      onSuccess: () => {
        router.push(routes.dashboard.budget.overview);
      },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create New Budget</h1>
      <BudgetForm onSubmit={handleSubmit} />
      <LoadingPopup isLoading={setBudgetPending} />
    </div>
  );
}
