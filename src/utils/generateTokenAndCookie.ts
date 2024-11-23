import { SignJWT } from "jose";
import { cookies } from "next/headers";

const generateTokenAndCookie = async (
  userId: string | unknown
): Promise<string> => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookiesStore = await cookies();

  cookiesStore.set("jwt", token, {
    maxAge: 15 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  console.log(token);
  return token;
};

export default generateTokenAndCookie;
