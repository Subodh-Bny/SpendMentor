"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetMonthlyExpenses,
  useGetTotalExpenses,
  useGetYearlyExpenses,
} from "@/hooks/use-analytics";
import ArrowLink from "../ArrowLink";
import routes from "@/config/routes";
import DashCard from "./dash-card";

export default function MonthlyYearlyOverview() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const { expenses: monthlyExpenses } = useGetMonthlyExpenses(
    currentMonth,
    currentYear
  );
  const yearlyExpenses = useGetYearlyExpenses(currentYear);

  const totalMonthly = useGetTotalExpenses(monthlyExpenses);
  const totalYearly = useGetTotalExpenses(yearlyExpenses);

  return (
    <DashCard
      title="Expense Overview"
      footer={
        <ArrowLink href={routes.dashboard.expenses}>Manage Expenses</ArrowLink>
      }
    >
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <div className="text-2xl font-bold">
            Rs. {totalMonthly.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total expenses for{" "}
            {new Date().toLocaleString("default", { month: "long" })}
          </p>
        </TabsContent>
        <TabsContent value="yearly">
          <div className="text-2xl font-bold">Rs. {totalYearly.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total expenses for {currentYear}
          </p>
        </TabsContent>
      </Tabs>
    </DashCard>
  );
}
