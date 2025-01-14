import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/user.model";
import bcryptjs from "bcryptjs";
import generateTokenAndCookie from "@/utils/generateTokenAndCookie";
import { cookies } from "next/headers";
import crypto from "crypto";
import sendEmail from "@/utils/sendEmail";

export const verifyEmail = async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Log the received token for debugging
  console.log("Received Token:", token);

  // Hash the token to compare with the stored hashed token
  const hashedToken = crypto
    .createHash("sha256")
    .update(token || "")
    .digest("hex");

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 400 }
    );
  }

  // Update user status after successful verification
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;

  await user.save();

  return NextResponse.json(
    { success: true, message: "Email verified successfully" },
    { status: 200 }
  );
};

export const sendVerificationAgain = async (req: Request) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    await dbConnect();

    const { email } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const verificationToken = user.getVerificationToken();

    await user.save({ validateBeforeSave: false });

    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = process.env.HOST;
    const verificationUrl = `${protocol}://${host}/auth/verify-email/${verificationToken}`;

    const message = `Please verify your email by clicking the following link: ${verificationUrl}`;

    // Send the email
    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
};

export const signup = async (req: Request) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
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

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Generate verification token
    const verificationToken = newUser.getVerificationToken();

    console.log("Generated Verification Token (raw):", verificationToken); // Log raw token
    console.log(
      "Generated Verification Token (hashed):",
      newUser.verificationToken
    );

    if (newUser) {
      // Generate verification token
      const verificationToken = newUser.getVerificationToken();
      await newUser.save({ validateBeforeSave: false });

      // Construct verification URL
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = process.env.HOST;
      const verificationUrl = `${protocol}://${host}/auth/verify-email/${verificationToken}`;

      // Send verification email
      const message = `Please verify your email by clicking the following link: ${verificationUrl}`;

      await sendEmail({
        email: newUser.email,
        subject: "Email Verification",
        message,
      });

      return NextResponse.json(
        { success: true, message: "Verification email sent." },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error in signup function:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
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

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Verify your email to login." },
        { status: 401 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
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
