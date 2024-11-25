"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BudgetForm } from "@/components/budget/budget-form";
import BudgetProgress from "@/components/budget/budget-progress";
import { useGetBudgetById } from "@/services/api/budgetApi";
import LoadingPopup from "@/components/loading-popup";

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

  //   useEffect(() => {
  //     // In a real app, you'd fetch this data from your API
  //     setBudget({
  //       id: budgetId,
  //       category: "Food",
  //       amount: 500,
  //       month: "2023-11",
  //       spent: 300,
  //     });
  //   }, [budgetId]);

  const handleSubmit = (updatedBudget: Omit<IBudget, "id" | "spent">) => {
    // In a real app, you'd send this data to your API
    console.log("Updating budget:", { ...updatedBudget, id: budgetId });
    router.push("/budget");
  };

  const handleDelete = () => {
    // In a real app, you'd send a delete request to your API
    console.log("Deleting budget:", budgetId);
    router.push("/budget");
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
      {budgetPending ? (
        <LoadingPopup
          isLoading={budgetPending}
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
