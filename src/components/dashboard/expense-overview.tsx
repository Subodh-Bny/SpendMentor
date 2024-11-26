"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMonthlyExpenses,
  getTotalExpenses,
  getYearlyExpenses,
} from "@/lib/data";

export default function MonthlyYearlyOverview() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = getMonthlyExpenses(currentMonth, currentYear);
  const yearlyExpenses = getYearlyExpenses(currentYear);

  const totalMonthly = getTotalExpenses(monthlyExpenses);
  const totalYearly = getTotalExpenses(yearlyExpenses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <div className="text-2xl font-bold">${totalMonthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total expenses for{" "}
              {new Date().toLocaleString("default", { month: "long" })}
            </p>
          </TabsContent>
          <TabsContent value="yearly">
            <div className="text-2xl font-bold">${totalYearly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total expenses for {currentYear}
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
