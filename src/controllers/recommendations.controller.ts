import Expense from "@/models/expenses.model";
import { validateAuth } from "./validateUser";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import cosineSimilarity from "@/utils/cosineSimilarity";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function getExpensesRecommendations(req: Request) {
  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }

    const { userId } = authResult;

    const expenses: IExpense[] = await Expense.find({ user: userId }).populate(
      "category",
      "name"
    );

    const monthlyExpenses: Record<string, Record<string, number>> = {};

    expenses.forEach(({ date, amount, category }) => {
      const month = new Date(date).toISOString().slice(0, 7);
      const categoryName =
        typeof category === "string" ? category : category.name;

      if (!monthlyExpenses[month]) monthlyExpenses[month] = {};
      monthlyExpenses[month][categoryName] =
        (monthlyExpenses[month][categoryName] || 0) + parseFloat(amount);
    });

    const months = Object.keys(monthlyExpenses).sort();
    const categories = Array.from(
      new Set(
        expenses.map((e) =>
          typeof e.category === "string" ? e.category : e.category.name
        )
      )
    );

    const vectors = months.map((month) =>
      categories.map((cat) => monthlyExpenses[month][cat] || 0)
    );

    const currentMonthVector = vectors[vectors.length - 1];
    const previousMonthVector =
      vectors[vectors.length - 2] || Array(categories.length).fill(0);

    const similarityScore = cosineSimilarity(
      currentMonthVector,
      previousMonthVector
    );

    // Thresholds for significant change
    const significantChangeThreshold = 0.5; // 50% increase
    const absoluteChangeThreshold = 1000; // Absolute increase of 1000 or more in any category

    let recommendations = "";

    // Compare individual category changes to detect significant increases
    const categoryChanges = currentMonthVector.map((value, index) => ({
      category: categories[index],
      change: value - previousMonthVector[index],
      changePercentage:
        (value - previousMonthVector[index]) / previousMonthVector[index] || 0,
      absoluteChange: value - previousMonthVector[index],
    }));

    // Identify categories with significant changes
    const increasedSpending = categoryChanges
      .filter(
        (change) =>
          change.change > 0 &&
          (change.changePercentage > significantChangeThreshold ||
            change.absoluteChange > absoluteChangeThreshold)
      )
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    const decreasedSpending = categoryChanges
      .filter(
        (change) =>
          change.change < 0 &&
          (change.changePercentage > significantChangeThreshold ||
            change.absoluteChange > absoluteChangeThreshold)
      )
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    if (increasedSpending.length || decreasedSpending.length) {
      recommendations = "Your spending pattern has deviated significantly. ";

      if (increasedSpending.length) {
        recommendations += `You have increased spending in these categories: ${increasedSpending
          .map((c) => `${c.category} (+${c.change.toFixed(2)})`)
          .join(", ")}. Consider reviewing your spending in these areas. `;
      }

      if (decreasedSpending.length) {
        recommendations += `You have decreased spending in these categories: ${decreasedSpending
          .map((c) => `${c.category} (${c.change.toFixed(2)})`)
          .join(
            ", "
          )}. If these reductions are intentional, great job! Otherwise, ensure you’re not neglecting important expenses.`;
      }
    } else {
      recommendations =
        "Your spending pattern is consistent with previous months. Keep up the good work maintaining balance across your budget!";
    }
    return NextResponse.json({
      success: true,
      data: { similarityScore, recommendations },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to analyze spending",
      error,
    });
  }
}
