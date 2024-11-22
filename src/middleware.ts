import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import routes from "./config/routes";
import { cookies } from "next/headers";
// import dbConnect from "./lib/dbConnect";
// import jwt from "jsonwebtoken";
// import User from "./models/user.model";
// import { internalError } from "./controllers/internalError";

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  console.log(token);
  const url = request.nextUrl;
  if (
    token &&
    (url.pathname.startsWith(routes.auth.login) ||
      url.pathname.startsWith(routes.auth.signUp))
  ) {
    url.pathname = routes.dashboard.home;
    return NextResponse.redirect(new URL(routes.dashboard.home, request.url));
  }
  if (!token && url.pathname.startsWith(routes.dashboard.home)) {
    url.pathname = routes.auth.login;
    return NextResponse.redirect(url);
  }

  // if (
  //   url.pathname.startsWith("/api/") &&
  //   !url.pathname.startsWith("/api/auth/") &&
  //   !token
  // ) {
  //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // }

  // if (
  //   url.pathname.startsWith("/api/") &&
  //   !url.pathname.startsWith("/api/auth/") &&
  //   token
  // ) {
  //   try {
  //     const decoded = jwt.verify(
  //       token,
  //       process.env.JWT_SECRET || ""
  //     ) as JwtPayloadWithUserId;
  //     if (!decoded) {
  //       return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  //     }

  //     await dbConnect();
  //     const user = await User.findById(decoded.userId).select("-password");

  //     if (!user) {
  //       return NextResponse.json({ message: "Unknown user" }, { status: 401 });
  //     }
  //     request.user = user;
  //   } catch (error) {
  //     return internalError("Error in middleware", error);
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/", "/dashboard/:path*"],
};
