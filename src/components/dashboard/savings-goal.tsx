"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { financialData } from "@/lib/data";

export default function SavingsGoal() {
  const { target, current } = financialData.savingsGoal;
  const percentageAchieved = (current / target) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goal</CardTitle>
        <CardDescription>Progress towards your target</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${current.toFixed(2)} / ${target}
        </div>
        <Progress value={percentageAchieved} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          You&apos;ve saved {percentageAchieved.toFixed(1)}% of your goal
        </p>
      </CardContent>
    </Card>
  );
}
