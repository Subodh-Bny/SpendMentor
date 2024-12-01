"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { useGetSavingsGoal } from "@/services/api/savingsGoalApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";

const months = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const useGetCurrentMonthTarget = (
  month: number
): { target: number; current: number } => {
  const { data: savingsGoalData } = useGetSavingsGoal();
  const currentMonthTarget = savingsGoalData?.find(
    (data) =>
      new Date(data.targetDate).getMonth() === month && // Subtract 1 to convert from 1-based to 0-based
      new Date(data.targetDate).getFullYear() === new Date().getFullYear()
  );
  if (!currentMonthTarget) {
    return { target: 0, current: 0 };
  }
  return {
    target: parseInt(
      typeof currentMonthTarget?.targetAmount === "string"
        ? currentMonthTarget.targetAmount
        : "0"
    ),
    current: parseInt(
      typeof currentMonthTarget?.currentAmount === "string"
        ? currentMonthTarget.currentAmount
        : "0"
    ),
  };
};

export default function SavingsGoal() {
  const [month, setMonth] = useState(new Date().getMonth()); // Add 1 to convert from 0-based to 1-based
  const { target, current } = useGetCurrentMonthTarget(month);

  const percentageAchieved = target > 0 ? (current / target) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="grid grid-cols-2 items-center">
          Savings Goal{" "}
          <Select
            defaultValue={new Date().getMonth().toString()}
            onValueChange={(value) => setMonth(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="h-56">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
        <CardDescription>Progress towards your target</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          Rs. {current.toFixed(2)} / Rs. {target}
        </div>
        <Progress value={percentageAchieved} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          You&apos;ve saved {percentageAchieved.toFixed(1)}% of your goal
        </p>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
