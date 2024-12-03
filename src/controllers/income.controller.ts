import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import { validateAuth } from "./validateUser";
import UserIncome from "@/models/income.model";

export const getUserIncome = async (req: Request) => {
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

    const userIncome = await UserIncome.findOne({ user: userId });

    return NextResponse.json(
      { message: "User Income fetched successfully", data: userIncome },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getUserIncome controller", error);
  }
};

export const updateUserIncome = async (req: Request) => {
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

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }

    const { userId } = authResult;
    const { income } = await req.json();

    const userIncome = await UserIncome.findOne({ user: userId });

    if (!userIncome) {
      const newIncome = new UserIncome({
        user: userId,
        income,
      });

      await newIncome.save();
      return NextResponse.json(
        { message: "Income saved successfully", data: newIncome },
        { status: 200 }
      );
    } else {
      userIncome.income = income;

      await userIncome.save();

      return NextResponse.json(
        { message: "Income saved successfully", data: userIncome },
        { status: 200 }
      );
    }
  } catch (error) {
    return internalError("Error in updateUserIncome controller", error);
  }
};
