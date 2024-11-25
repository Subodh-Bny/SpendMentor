import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import Expense from "@/models/expenses.model";

import { validateAuth } from "./validateUser";
import Budget from "@/models/budget.model";

export const addExpenses = async (req: Request) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    const { date, description, amount, category } = await req.json();

    const newExpense = new Expense({
      date,
      description,
      amount,
      user: userId,
      category,
    });

    const expenseMonth = new Date(date).toISOString().slice(0, 7);
    const budget = await Budget.findOne({
      category,
      user: userId,
      month: expenseMonth,
    });

    if (budget) {
      budget.spent = (budget.spent || 0) + parseFloat(newExpense.amount);
      await budget.save();
    }

    await newExpense.save();

    return NextResponse.json(
      { message: "Expense added successfully", data: newExpense },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in addExpense controller", error);
  }
};

export const getExpenses = async (req: Request) => {
  if (req.method !== "GET") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }

    const { userId } = authResult;

    const expenses = await Expense.find({ user: userId }).populate("category");

    return NextResponse.json(
      { message: "Expenses fetched successfully", data: expenses },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getExpenses controller", error);
  }
};

export const deleteExpense = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "DELETE") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    const authResult = await validateAuth();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();
    const { id } = await params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        { message: "Couldn't find the expense" },
        { status: 404 }
      );
    }

    const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
    const budget = await Budget.findOne({
      category: expense.category,
      user: expense.user,
      month: expenseMonth,
    });

    if (budget) {
      budget.spent = Math.max(
        0,
        (budget.spent || 0) - parseFloat(expense.amount)
      );
      await budget.save();
    }

    await expense.deleteOne();

    return NextResponse.json(
      { message: "Expense deleted successfully", data: expense },
      { status: 202 }
    );
  } catch (error) {
    return internalError("Error in deleteExpense controller", error);
  }
};

export const updateExpense = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "PUT") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    await dbConnect();

    const { date, description, amount, category } = await req.json();
    const { id } = await params;

    const previousExpense = await Expense.findById(id);

    if (!previousExpense) {
      return NextResponse.json(
        {
          message: "Couldnot find the Expense",
        },
        { status: 404 }
      );
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, {
      date,
      description,
      amount,
      category,
    });

    const expenseMonth = new Date(date).toISOString().slice(0, 7);

    const budget = await Budget.findOne({
      category,
      user: userId,
      month: expenseMonth,
    });

    if (budget) {
      const previousAmount = parseFloat(previousExpense?.amount || "0");
      const updatedAmount = parseFloat(updatedExpense?.amount || "0");

      budget.spent = Math.max(
        0,
        (budget.spent || 0) - previousAmount + updatedAmount
      );
      await budget.save();
    }

    return NextResponse.json(
      { message: "Expense updated successfully", data: updatedExpense },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateExpense controller", error);
  }
};
