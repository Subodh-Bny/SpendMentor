import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user.model";
import bcryptjs from "bcryptjs";
import generateTokenAndCookie from "@/utils/generateTokenAndCookie";
import { cookies } from "next/headers";

export const signup = async (req: Request) => {
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

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 400 }
      );
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User created successfully", data: newUser },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in signup controller", error);
  }
};

export const login = async (req: Request) => {
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

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or passord" },
        { status: 401 }
      );
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid email or passord" },
        { status: 401 }
      );
    }

    const token = await generateTokenAndCookie(user.id);

    return NextResponse.json(
      {
        message: "Logged in",
        data: { id: user.id, email: user.email, name: user.name },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in login controller", error);
  }
};

export const logout = async (req: Request) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 } // Use 405 for "Method Not Allowed"
    );
  }

  try {
    const cookiesStore = await cookies();
    // Clear the JWT cookie
    cookiesStore.set("jwt", "", {
      maxAge: 0, // Immediately expire
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};
