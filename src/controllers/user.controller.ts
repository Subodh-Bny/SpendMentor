import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import { validateAuth } from "./validateUser";
import User from "@/models/user.model";

export const updateAccount = async (req: Request) => {
  if (req.method !== "PUT") {
    return NextResponse.json(
      { message: "Method not allowed" },
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
    const { name, email } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: "No fields should be empty" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "Couldn't find user.", id: userId },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Account updated successfully", data: user },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateAccount controller", error);
  }
};
