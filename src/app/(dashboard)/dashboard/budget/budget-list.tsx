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
import { Progress } from "@/components/ui/progress";

const budgets: IBudget[] = [
  {
    id: "1",
    category: { name: "Food" },
    amount: 500,
    month: "2023-11",
    spent: 0,
    user: "",
  },
  {
    id: "2",
    category: { name: "Transportation" },
    amount: 200,
    month: "2023-11",
    spent: 150,
    user: "",
  },
  {
    id: "3",
    category: { name: "Entertainment" },
    amount: 100,
    month: "2023-11",
    spent: 80,
    user: "",
  },
];

const BudgetList = () => {
  return budgets?.map((budget) => {
    const percentage = ((budget?.spent || budget.amount) / budget.amount) * 100;
    const remainingBudget = budget.amount - (budget?.spent || 0);
    let statusColor = "bg-green-500";
    if (percentage >= 90) {
      statusColor = "bg-red-500";
    } else if (percentage >= 75) {
      statusColor = "bg-yellow-500";
    }
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
          <Progress value={percentage} className={statusColor} />
          <div className="text-sm text-gray-500">{`Remaining: Rs. ${remainingBudget.toFixed(
            2
          )}`}</div>
        </CardContent>
        <CardFooter>
          <Link
            href={"/"}
            className={`${buttonVariants({ variant: "outline" })}`}
          >
            View details
          </Link>
        </CardFooter>
      </Card>
    );
  });
};

export default BudgetList;
