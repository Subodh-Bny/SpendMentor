"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BudgetForm } from "@/components/budget/budget-form";
import BudgetProgress from "@/components/budget/budget-progress";
import {
  useDeleteBudget,
  useGetBudgetById,
  useUpdateBudget,
} from "@/services/api/budgetApi";
import LoadingPopup from "@/components/loading-popup";
import routes from "@/config/routes";

export default function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  //   const [budget, setBudget] = useState<IBudget | null>(null);
  const router = useRouter();
  const budgetId = React.use(params).id;

  const {
    data: budget,
    isPending: budgetPending,
    isError: budgetError,
  } = useGetBudgetById({
    id: budgetId,
  });
  const { mutate: budgetUpdate, isPending: budgetUpdatePending } =
    useUpdateBudget();
  const { mutate: deleteBudget, isPending: budgetDeletePending } =
    useDeleteBudget();

  const handleSubmit = (updatedBudget: Omit<IBudget, "id" | "spent">) => {
    budgetUpdate(
      { ...updatedBudget, id: budget?.id },
      {
        onSuccess: () => {
          router.push(routes.dashboard.budget.overview);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteBudget(budget?.id || "", {
      onSuccess: () => {
        router.push(routes.dashboard.budget.overview);
      },
    });
  };

  if (budgetError) {
    return (
      <div className="text-center">
        Couldn&apos;t load Budget details, Please try again later.
      </div>
    );
  }

  return (
    <>
      {budgetPending || budgetUpdatePending || budgetDeletePending ? (
        <LoadingPopup
          isLoading={
            budgetPending || budgetUpdatePending || budgetDeletePending
          }
          message="Fetching budget details ..."
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Budget Details</h1>
          <div className="mb-4">
            <BudgetProgress budget={budget} />
          </div>
          <BudgetForm
            budget={budget}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
          />
        </>
      )}
    </>
  );
}
