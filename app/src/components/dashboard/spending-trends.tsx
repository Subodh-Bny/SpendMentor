"use client";

import { useContext, useState } from "react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  useGetCategories,
  useGetCategoryTotal,
  useGetMonthlyExpenses,
} from "@/hooks/use-analytics";
import { useTheme } from "next-themes";
import MonthSelector from "../month-selector";
import { useExpensePrediction } from "@/services/api/predictionApi";
import { AuthContext } from "@/context/AuthContext";

const usePrepareSpendData = (month: number, year: number) => {
  const { expenses } = useGetMonthlyExpenses(month, year);
  const allCategories = useGetCategories();
  const categoryTotals = useGetCategoryTotal(expenses);

  const categories = allCategories.map((category) => category.name);
  const amounts = categories.map(
    (categoryName) => categoryTotals[categoryName] || 0
  );

  return { categories, amounts };
};

const SpendTrendAnalysisChart = () => {
  const [month, setMonth] = useState(new Date().getMonth());
  const year = new Date().getFullYear();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);

  const { categories, amounts } = usePrepareSpendData(month, year);
  const { data: predictionData } = useExpensePrediction(user?.id);

  // Prepare prediction data to match the same categories as actual spending
  const preparePredictionData = () => {
    if (!predictionData) return null;

    // Get the predicted amounts for the current month's categories
    return categories.map((category) => {
      // Convert category name to match the prediction format if needed
      const predictionKey =
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      return (
        predictionData.predicted_amounts[
          predictionKey as keyof typeof predictionData.predicted_amounts
        ] || 0
      );
    });
  };

  const predictionAmounts = preparePredictionData();

  // Format data for recharts
  const chartData = categories.map((category, index) => {
    return {
      category,
      actual: amounts[index],
      predicted: predictionAmounts ? predictionAmounts[index] : 0,
    };
  });

  // Chart configuration for shadcn/ui ChartContainer
  const chartConfig = {
    actual: {
      label: "Actual Spending",
      color: "hsl(221, 83%, 53%)", // Blue
    },
    predicted: {
      label: "Predicted Spending",
      color: "hsl(38, 92%, 50%)", // Amber
    },
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Category Spend Trend</h1>
        <MonthSelector setMonth={setMonth} />
      </div>

      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartContainer config={chartConfig}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="category"
                tick={{
                  fill: theme === "light" ? "#333" : "white",
                  fontSize: 10,
                }}
                angle={-45}
                textAnchor="end"
                tickMargin={10}
              />
              <YAxis
                tick={{
                  fill: theme === "light" ? "#333" : "white",
                  fontSize: 10,
                }}
                tickFormatter={(value) => `Rs.${value}`}
                width={60}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="var(--color-actual)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1, fill: "white" }}
                activeDot={{ r: 6 }}
              />
              {predictionAmounts && (
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="var(--color-predicted)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 1, fill: "white" }}
                />
              )}
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `Rs.${Number.parseFloat(value.toString()).toFixed(2)}`
                    }
                  />
                }
              />
            </LineChart>
          </ChartContainer>
        </ResponsiveContainer>
      </div>

      {predictionData && (
        <div className="text-sm text-muted-foreground mt-4">
          Prediction based on {predictionData.based_on_months} months of
          historical data
        </div>
      )}
    </Card>
  );
};

export default SpendTrendAnalysisChart;
