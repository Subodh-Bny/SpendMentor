import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import Expense from "@/models/expenses.model";

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

    const { date, description, amount, category } = await req.json();

    const newExpense = new Expense({
      date,
      description,
      amount,
      category,
    });

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

    const { date, description, amount, category } = await req.json();

    const newExpense = new Expense({
      date,
      description,
      amount,
      category,
    });

    await newExpense.save();

    return NextResponse.json(
      { message: "Expense added successfully", data: newExpense },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in addExpense controller", error);
  }
};
