import BudgetVsActual from "@/components/dashboard/budget-vs-actual";
import CategoryBreakdown from "@/components/dashboard/category-breakdown";
import ExpenseOverview from "@/components/dashboard/expense-overview";
import SavingsGoal from "@/components/dashboard/savings-goal";
import SpendingTrends from "@/components/dashboard/spending-trends";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsGoalForm } from "@/components/dashboard/savings-goal-form";

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-4">
          <section className="grid gap-4  md:grid-cols-3">
            <ExpenseOverview />
            <BudgetVsActual />
            <SavingsGoal />
          </section>
          <section>
            <CategoryBreakdown />
          </section>
          <section>
            <SpendingTrends />
          </section>{" "}
        </TabsContent>
        <TabsContent value="analytics">
          <SavingsGoalForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
