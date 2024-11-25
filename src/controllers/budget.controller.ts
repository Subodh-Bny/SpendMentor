import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import { validateAuth } from "./validateUser";
import Budget from "@/models/budget.model";

export const setBudget = async (req: Request) => {
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

    const budgets = await Budget.find({ user: userId }).populate("category");

    return NextResponse.json(
      { message: "Budget fetched successfully", data: budgets },
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
      { status: 404 }
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

export const getBudgetById = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    const { id } = await params;

    const budget = await Budget.findById(id).populate("category");

    return NextResponse.json(
      { message: "Budget fetched successfully", data: budget },
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
      { status: 404 }
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

    const updatedBudget = await Budget.findByIdAndUpdate(
      id,
      { amount, month, category },
      { new: true }
    );

    return NextResponse.json(
      { message: "Budget updated successfully", data: updatedBudget },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateBudget controller", error);
  }
};
