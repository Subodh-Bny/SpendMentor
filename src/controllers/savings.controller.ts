import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import { validateAuth } from "./validateUser";
import SavingsGoal from "@/models/savings.goal.model";

export const createSavingsGoal = async (req: Request) => {
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

    const { targetAmount, targetDate, currentAmount } = await req.json();

    const existingGoal = await SavingsGoal.findOne({ targetDate });

    if (existingGoal) {
      return NextResponse.json(
        {
          message:
            "Goal for selected date already exists. Please update the existing one or create goal for another date",
        },
        { status: 400 }
      );
    }

    const newSavingsGoal = new SavingsGoal({
      targetAmount,
      targetDate,
      currentAmount,
      user: userId,
    });

    await newSavingsGoal.save();

    return NextResponse.json(
      { message: "Goal created successfully", data: newSavingsGoal },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in createSavingsGoal controller", error);
  }
};

export const getSavingsGoal = async (req: Request) => {
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

    const savingsGoal = await SavingsGoal.find({ user: userId }).sort({
      targetDate: 1,
    });

    return NextResponse.json(
      { message: "SavingsGoal fetched successfully", data: savingsGoal },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getSavingsGoal controller", error);
  }
};

export const deleteSavingsGoal = async (
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

    const deletedSavingsGoal = await SavingsGoal.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Goal deleted successfully", data: deletedSavingsGoal },
      { status: 202 }
    );
  } catch (error) {
    return internalError("Error in deleteSavingsGoal controller", error);
  }
};

export const updateSavingsGoal = async (
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
    const { currentAmount, targetAmount, targetDate } = await req.json();
    const { id } = await params;

    const updatedGoal = await SavingsGoal.findOneAndUpdate(
      { _id: id },
      { $set: { targetAmount, currentAmount, targetDate } },
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      return NextResponse.json(
        { message: "Savings goal not found or already up to date" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Savings goal updated successfully", data: updatedGoal },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateSavingsGoal controller", error);
  }
};
