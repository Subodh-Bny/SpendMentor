import { NextResponse } from "next/server";
import { validateAuth } from "./validateUser";
import dbConnect from "@/lib/dbConnect";
import Budget from "@/models/budget.model";
import Expense from "@/models/expenses.model";
import { internalError } from "./internalError";
import Category from "@/models/category.model";

export const getAnalytics = async (req: Request) => {
  if (req.method !== "GET") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 405 }
    );
  }

  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }

    const { userId } = authResult;

    const budgets: IBudget[] = await Budget.find({ user: userId }).populate(
      "category"
    );
    const expenses: IExpense[] = await Expense.find({ user: userId }).populate(
      "category"
    );

    const categories: ICategory[] = await Category.find({ user: userId });

    const financialData = {
      expenses: expenses,
      budgets: budgets,
      categories: categories,
    };

    return NextResponse.json(
      { message: "Analytics fetched successfullys", data: financialData },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getAnalytics controller", error);
  }
};
