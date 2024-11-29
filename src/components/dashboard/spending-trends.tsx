"use client";
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";

import { Card } from "../ui/card";
import { useGetAnalytics } from "@/services/api/analyticsApi";
import {
  useGetCategories,
  useGetCategoryTotal,
  useGetMonthlyExpenses,
} from "@/hooks/use-analytics";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

const usePrepareSpendData = (month: number, year: number) => {
  // Get the expenses for a given month and year
  const expenses: IExpense[] = useGetMonthlyExpenses(month, year);

  // Get all categories
  const allCategories: ICategory[] = useGetCategories();

  // Aggregate expenses by category
  const categoryTotals = useGetCategoryTotal(expenses);

  // Prepare the labels (category names) and the corresponding data (amounts)
  const categories: string[] = allCategories.map((category) => category.name);
  const amounts: number[] = categories.map(
    (categoryName) => categoryTotals[categoryName] || 0
  );

  return { categories, amounts };
};

const SpendTrendAnalysisChart = () => {
  const month = 11; // March (0 = January, 1 = February, etc.)
  const year = 2024;
  const { data } = useGetAnalytics();
  console.log(data);

  const { categories, amounts } = usePrepareSpendData(month, year);

  const lineData = {
    labels: categories, // Categories as labels
    datasets: [
      {
        label: "Spending by Category",
        data: amounts,
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        fill: true,
        tension: 0.4,
        pointBorderColor: "#2563eb",
        pointBackgroundColor: "#ffffff",
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: "top" as const, // Legend at the top
        labels: {
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.raw.toFixed(2)}`, // Format tooltip values as currency
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Category",
          color: "#666",
        },
        ticks: {
          color: "#333",
        },
      },
      y: {
        title: {
          display: true,
          text: "Amount (NRS)",
          color: "#666",
        },
        ticks: {
          color: "#333",
          callback: (value: string | number) => {
            return `Rs.${typeof value === "number" ? value.toFixed(2) : value}`;
          },
        },
      },
    },
  };

  return (
    <Card className="p-9">
      <h1 className="text-4xl font-bold">Category Spend Trend</h1>
      <div className="h-80 mt-4 overflow-scroll">
        <Line data={lineData} options={options} />
      </div>
    </Card>
  );
};

export default SpendTrendAnalysisChart;
