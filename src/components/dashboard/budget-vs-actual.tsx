"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getMonthlyExpenses,
  getTotalExpenses,
  financialData,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export default function BudgetVsActual() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = getMonthlyExpenses(currentMonth, currentYear);
  const totalMonthly = getTotalExpenses(monthlyExpenses);
  const monthlyBudget = financialData.budget.monthly;

  const percentageSpent = (totalMonthly / monthlyBudget) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
        <CardDescription>Monthly overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${totalMonthly.toFixed(2)} / ${monthlyBudget}
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
      </CardContent>
    </Card>
  );
}
