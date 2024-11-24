import { headers } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
/**
 * Middleware to validate user authentication.
 * Ensures that `userId` exists in the request headers.
 *
 * @param req The Next.js request object
 * @returns `userId` if valid, or an unauthorized response if invalid
 */
export const validateAuth = async (): Promise<
  { userId: string } | NextResponse
> => {
  const headersList = await headers();
  const userId = headersList.get("X-User-Id");
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }
  return { userId };
};
