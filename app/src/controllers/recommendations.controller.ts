import { NextResponse } from "next/server";
import Expense from "@/models/expenses.model";
import { validateAuth } from "./validateUser";
import dbConnect from "@/lib/dbConnect";
import cosineSimilarity from "@/utils/cosineSimilarity";

interface ICategorySpending {
  [category: string]: number;
}

interface IMonthlyData {
  [month: string]: ICategorySpending;
}

export default async function getExpensesRecommendations(
  req: Request
): Promise<NextResponse> {
  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;
    const expenses = await Expense.find({ user: userId })
      .populate("category", "name")
      .sort({ date: 1 });

    if (expenses.length === 0) {
      return createResponse(0, ["No expense data available to analyze."]);
    }

    // Get the most recent expense date
    const latestExpenseDate = new Date(expenses[expenses.length - 1].date);
    const currentYear = latestExpenseDate.getUTCFullYear();
    const currentMonthNum = latestExpenseDate.getUTCMonth() + 1;

    const prevMonthDate = new Date(
      Date.UTC(currentYear, currentMonthNum - 1, 1)
    );
    prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
    const previousYear = prevMonthDate.getUTCFullYear();
    const previousMonthNum = prevMonthDate.getUTCMonth() + 1;

    const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(
      2,
      "0"
    )}`;
    const previousMonth = `${previousYear}-${String(previousMonthNum).padStart(
      2,
      "0"
    )}`;

    const { monthlyData, categories } = organizeExpensesByMonth(expenses);

    const { startStr: currentStart, endStr: currentEnd } =
      getMonthDateRangeStrings(currentYear, currentMonthNum);
    const { startStr: prevStart, endStr: prevEnd } = getMonthDateRangeStrings(
      previousYear,
      previousMonthNum
    );

    const currentMonthExpenses = filterExpensesByMonth(
      expenses,
      currentYear,
      currentMonthNum
    );
    const previousMonthExpenses = filterExpensesByMonth(
      expenses,
      previousYear,
      previousMonthNum
    );

    const currentData = calculateMonthlyTotals(
      currentMonthExpenses,
      categories
    );
    const previousData = calculateMonthlyTotals(
      previousMonthExpenses,
      categories
    );

    const similarityScore = calculateSimilarityScore(
      currentData,
      previousData,
      categories
    );

    const recommendations = generateRecommendations(
      currentData,
      previousData,
      currentMonth,
      previousMonth,
      categories
    );

    return createResponse(similarityScore, recommendations);
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate recommendations",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getMonthDateRangeStrings(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { startStr, endStr };
}

function filterExpensesByMonth(expenses: any[], year: number, month: number) {
  const { startStr, endStr } = getMonthDateRangeStrings(year, month);
  return expenses.filter(({ date }) => {
    const iso = new Date(date).toISOString().slice(0, 10);
    return iso >= startStr && iso < endStr;
  });
}

function organizeExpensesByMonth(expenses: any[]) {
  const monthlyData: IMonthlyData = {};
  const allCategories = new Set<string>();

  expenses.forEach(({ date, amount, category }) => {
    const expenseDate = new Date(date);
    const year = expenseDate.getUTCFullYear();
    const month = expenseDate.getUTCMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const categoryName =
      typeof category === "string" ? category : category.name;
    allCategories.add(categoryName);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {};
    }

    monthlyData[monthKey][categoryName] =
      (monthlyData[monthKey][categoryName] || 0) +
      parseFloat(amount.toString());
  });

  return {
    monthlyData,
    categories: Array.from(allCategories),
  };
}

function calculateMonthlyTotals(
  expenses: any[],
  categories: string[]
): ICategorySpending {
  const monthlyData: ICategorySpending = {};
  categories.forEach((cat) => (monthlyData[cat] = 0));

  expenses.forEach(({ amount, category }) => {
    const categoryName =
      typeof category === "string" ? category : category.name;
    monthlyData[categoryName] += parseFloat(amount.toString());
  });

  return monthlyData;
}

function calculateSimilarityScore(
  currentMonth: ICategorySpending,
  previousMonth: ICategorySpending,
  categories: string[]
): number {
  const currentVector = categories.map((cat) => currentMonth[cat] || 0);
  const previousVector = categories.map((cat) => previousMonth[cat] || 0);
  return cosineSimilarity(currentVector, previousVector);
}

function generateRecommendations(
  current: ICategorySpending,
  previous: ICategorySpending,
  currentMonth: string,
  previousMonth: string,
  categories: string[]
): string[] {
  const recommendations: string[] = [];

  recommendations.push(`Comparing ${currentMonth} with ${previousMonth}`);

  const totalCurrent = Object.values(current).reduce((a, b) => a + b, 0);
  const totalPrevious = Object.values(previous).reduce((a, b) => a + b, 0);
  const totalChange = totalCurrent - totalPrevious;
  const totalChangePercent =
    totalPrevious > 0 ? (totalChange / totalPrevious) * 100 : 0;

  if (totalPrevious === 0) {
    if (totalCurrent > 0) {
      recommendations.push(
        `New spending this month: Rs ${totalCurrent.toFixed(2)}`
      );
    }
  } else {
    if (Math.abs(totalChangePercent) > 10) {
      const trend = totalChange > 0 ? "increased" : "decreased";
      recommendations.push(
        `Total spending ${trend} by ${Math.abs(totalChangePercent).toFixed(
          1
        )}% ` +
          `(${totalChange > 0 ? "+" : ""}Rs ${Math.abs(totalChange).toFixed(
            2
          )})`
      );
    } else {
      recommendations.push("Overall spending remains stable");
    }
  }

  categories.forEach((category) => {
    const currentAmount = current[category] || 0;
    const previousAmount = previous[category] || 0;
    const change = currentAmount - previousAmount;

    if (previousAmount === 0 && currentAmount > 0) {
      recommendations.push(
        `New spending in ${category}: Rs ${currentAmount.toFixed(2)}`
      );
    } else if (currentAmount === 0 && previousAmount > 0) {
      recommendations.push(
        `Stopped spending on ${category} (saved Rs ${previousAmount.toFixed(
          2
        )})`
      );
    } else if (previousAmount > 0) {
      const changePercent = (change / previousAmount) * 100;
      if (Math.abs(changePercent) > 30 && Math.abs(change) > 50) {
        const trend = change > 0 ? "↑" : "↓";
        recommendations.push(
          `${category} spending ${trend} by ${Math.abs(changePercent).toFixed(
            1
          )}% ` + `(${trend} $${Math.abs(change).toFixed(2)})`
        );
      }
    }
  });

  return recommendations.length > 0
    ? recommendations
    : ["No significant changes in spending patterns"];
}

function createResponse(
  similarityScore: number,
  recommendations: string[]
): NextResponse {
  return NextResponse.json({
    success: true,
    data: { similarityScore, recommendations },
  });
}
