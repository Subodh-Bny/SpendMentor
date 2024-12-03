import bcryptjs from "bcryptjs";
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
        { message: "Couldn't find user." },
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

export const changePassword = async (req: Request) => {
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
      return authResult;
    }

    const { userId } = authResult;
    const { newPassword, currentPassword } = await req.json();

    if (!newPassword?.trim() || !currentPassword?.trim()) {
      return NextResponse.json(
        { message: "Password fields should not be empty" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    const isPasswordCorrect = await bcryptjs.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid current password" },
        { status: 401 }
      );
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in changePassword controller", error);
  }
};
