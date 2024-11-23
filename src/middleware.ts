import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("jwt")?.value; // Retrieve JWT from cookies
  const url = req.nextUrl;

  // Redirect users without a token trying to access /dashboard/:path*
  if (url.pathname.startsWith("/dashboard/") && !token) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith("/auth/") && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect API routes other than /api/auth/*
  if (
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth/") &&
    !token
  ) {
    return NextResponse.json(
      { message: "Unauthorized - No Token Provided" },
      { status: 401 }
    );
  }

  // Validate token if it exists
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Redirect invalid token requests for /dashboard/:path*
      if (url.pathname.startsWith("/dashboard/")) {
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }
      console.log(error);
      // Respond with 401 for invalid tokens on /api/:path*
      if (url.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Unauthorized - Invalid Token" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

// Specify route matcher
export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/auth/:path*"], // Protects dashboard and API routes
};
