import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import { validateAuth } from "./validateUser";
import Budget from "@/models/budget.model";
import Expense from "@/models/expenses.model";

export const setBudget = async (req: Request) => {
  if (req.method !== "POST") {
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "User id invalid" }, { status: 404 });
    }

    const { category, month, amount } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return NextResponse.json(
        { message: "Category invalid" },
        { status: 404 }
      );
    }

    const newBudget = new Budget({
      category,
      month,
      amount,
      user: userId,
    });

    await newBudget.save();

    return NextResponse.json(
      { message: "Budget created successfully", data: newBudget },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in setBudget controller", error);
  }
};

export const getBudgets = async (req: Request) => {
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

    const budgets = await Budget.find({ user: userId }).populate("category");

    if (!budgets) {
      return NextResponse.json(
        { message: "No budgets found" },
        { status: 404 }
      );
    }

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(`${budget.month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0);

        if (!mongoose.Types.ObjectId.isValid(budget?.category?._id)) {
          return NextResponse.json({ message: "Invalid category" });
        }

        const category: string = budget?.category?._id || "";

        const spentAggregation = await Expense.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              category: new mongoose.Types.ObjectId(category),
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $addFields: {
              amountNumber: { $toDouble: "$amount" },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: "$amountNumber" },
            },
          },
        ]);

        const totalSpent = spentAggregation[0]?.totalSpent || 0;
        return { ...budget.toObject(), spent: totalSpent };
      })
    );

    return NextResponse.json(
      { message: "Budget fetched successfullys", data: budgetsWithSpent },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getBudgets controller", error);
  }
};

export const deleteBudget = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "DELETE") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 405 }
    );
  }

  try {
    await dbConnect();

    const { id } = await params;

    const deletedBudget = await Budget.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Budget deleted successfully", data: deletedBudget },
      { status: 202 }
    );
  } catch (error) {
    return internalError("Error in deleteBudget controller", error);
  }
};

async function getSingleBudgetSpent(userId: string, budget: IBudget) {
  const startDate = new Date(`${budget.month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);

  const category: string =
    (typeof budget?.category === "object" ? budget?.category?.id : "") || "";

  const spentAggregation = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category: new mongoose.Types.ObjectId(category),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        amountNumber: { $toDouble: "$amount" }, // Convert `amount` to number
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amountNumber" },
      },
    },
  ]);

  const spent =
    spentAggregation.length > 0 ? spentAggregation[0].totalSpent : 0;
  return spent;
}

export const getBudgetById = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    const { id } = await params;

    const budget = await Budget.findById(id).populate("category");

    if (!budget) {
      return NextResponse.json(
        { message: "Budget not found" },
        { status: 404 }
      );
    }

    const totalSpent = await getSingleBudgetSpent(budget.user, budget);

    return NextResponse.json(
      {
        message: "Budget fetched successfully",
        data: { ...budget.toObject(), spent: totalSpent },
      },
      { status: 202 }
    );
  } catch (error) {
    return internalError("Error in getBudgetById controller", error);
  }
};

export const updateBudget = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "PUT") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 405 }
    );
  }

  try {
    await dbConnect();

    const { amount, month, category } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return NextResponse.json(
        { message: "Category invalid" },
        { status: 404 }
      );
    }

    const { id } = await params;

    const budget = await Budget.findByIdAndUpdate(id, {
      amount,
      month,
      category,
    });

    if (!budget) {
      return NextResponse.json(
        { message: "Budget not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Budget updated successfully", data: budget },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateBudget controller", error);
  }
};
