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
import {
  getMonthlyExpenses,
  getCategoryTotal,
  financialData,
} from "@/lib/data";
import { Card } from "../ui/card";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

const prepareSpendData = (month: number, year: number) => {
  // Get the expenses for a given month and year
  const expenses = getMonthlyExpenses(month, year);

  // Aggregate expenses by category
  const categoryTotals = getCategoryTotal(expenses);

  // Prepare the labels (categories) and the corresponding data (amounts)
  const categories = Object.keys(financialData.budget.categories);
  const amounts = categories.map((category) => categoryTotals[category] || 0);

  return { categories, amounts };
};

const SpendTrendAnalysisChart = () => {
  const month = 3; // March (0 = January, 1 = February, etc.)
  const year = 2023;

  const { categories, amounts } = prepareSpendData(month, year);

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
