"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import BudgetProgress from "./budget-progress";
import routes from "@/config/routes";
import { useGetBudgets } from "@/services/api/budgetApi";
import LoadingPopup from "../loading-popup";

const BudgetList = () => {
  const { data: budgets, isPending: getBudgetPending } = useGetBudgets();

  if (getBudgetPending) {
    return <LoadingPopup isLoading={getBudgetPending} />;
  }
  return budgets && budgets?.length > 0 ? (
    budgets?.map((budget) => {
      return (
        <Card key={budget.id}>
          <CardHeader>
            <CardTitle className="flex justify-between font-medium">
              <span>
                {typeof budget?.category === "object" && budget.category.name} -{" "}
                {budget.month}
              </span>
              <span>
                Rs. {budget.spent} / Rs. {budget.amount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <BudgetProgress budget={budget} />
          </CardContent>
          <CardFooter>
            <Link
              href={routes.dashboard.budget.overview + budget.id}
              className={`${buttonVariants({ variant: "outline" })}`}
            >
              View details
            </Link>
          </CardFooter>
        </Card>
      );
    })
  ) : (
    <div className="text-center ">
      No budgets created! Click Add Budget to create one.
    </div>
  );
};

export default BudgetList;
