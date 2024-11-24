import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { JWTPayload, jwtVerify } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
}

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
      const decoded = (await jwtVerify(token, secret)) as {
        payload: CustomJWTPayload;
      };
      const userId = decoded.payload.userId;

      // Pass user ID to subsequent middleware or handler via headers
      const response = NextResponse.next();
      response.headers.set("X-User-Id", userId);
      return response;
    } catch (error) {
      console.error("Token verification error:", error);

      // Redirect invalid token requests for /dashboard/:path*
      if (url.pathname.startsWith("/dashboard")) {
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

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
