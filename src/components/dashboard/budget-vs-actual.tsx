"use client";

import { Progress } from "@/components/ui/progress";
import {
  useGetMonthlyBudget,
  useGetMonthlyExpenses,
  useGetTotalExpenses,
} from "@/hooks/use-analytics";

import { cn } from "@/lib/utils";
import ArrowLink from "../ArrowLink";
import routes from "@/config/routes";
import DashCard from "./dash-card";

export default function BudgetVsActual() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const { expenses: monthlyExpenses } = useGetMonthlyExpenses(
    currentMonth,
    currentYear
  );
  const totalMonthly = useGetTotalExpenses(monthlyExpenses);
  const monthlyBudget = useGetMonthlyBudget(currentMonth);

  const percentageSpent = (totalMonthly / monthlyBudget) * 100;

  return (
    <DashCard
      title="Budget vs Actual"
      description="Monthly overview"
      footer={
        <ArrowLink href={routes.dashboard.budget.overview}>
          Manage Budget
        </ArrowLink>
      }
    >
      {" "}
      <div className="text-2xl font-bold">
        Rs. {totalMonthly.toFixed(2)} / Rs. {monthlyBudget}
      </div>
      <Progress
        value={percentageSpent}
        className={cn(percentageSpent > 100 ? "bg-destructive" : "", "mt-2")}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {percentageSpent > 100
          ? "You've exceeded your monthly budget!"
          : percentageSpent > 90
          ? "You're nearing your monthly budget limit."
          : "You're within your monthly budget."}
      </p>
    </DashCard>
  );
}
