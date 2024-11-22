import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const generateTokenAndCookie = async (
  userId: string | unknown
): Promise<string> => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "", {
    expiresIn: "7d",
  });

  const cookiesStore = await cookies();

  cookiesStore.set("jwt", token, {
    maxAge: 15 * 24 * 60 * 60, // Max age in seconds
    httpOnly: true, // For security
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development", // Secure in non-dev environments
  });
  console.log(token);
  return token;
};

export default generateTokenAndCookie;
