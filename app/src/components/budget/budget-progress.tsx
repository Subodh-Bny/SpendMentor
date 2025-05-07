import React from "react";
import { Progress } from "../ui/progress";

const BudgetProgress = ({ budget }: { budget?: IBudget }) => {
  const percentage = budget
    ? ((budget?.spent || budget?.amount || 100) / budget?.amount || 100) * 100
    : 0;
  const remainingBudget = budget ? budget?.amount - (budget?.spent || 0) : 0;

  let statusColor = "bg-green-500";
  if (percentage >= 90) {
    statusColor = "bg-red-500";
  } else if (percentage >= 75) {
    statusColor = "bg-yellow-500";
  }

  return (
    <>
      <Progress value={percentage} className={statusColor} />
      <div className="text-sm text-gray-500">{`Remaining: Rs. ${remainingBudget.toFixed(
        2
      )}`}</div>
    </>
  );
};

export default BudgetProgress;
