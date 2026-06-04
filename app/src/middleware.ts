import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWTPayload, jwtVerify } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: string;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("jwt")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const url = req.nextUrl.clone();

  // Log authentication attempts (non-blocking)
  logAuthAttempt(req.url, !!token);

  // Handle CORS for API routes
  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  }

  // Handle root route
  if (url.pathname === "/") {
    if (token) {
      return NextResponse.rewrite(new URL("/dashboard", req.url));
    }
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Helper: handle unauthorized access
  const handleUnauthorized = (message: string) => {
    if (url.pathname.startsWith("/dashboard")) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ message }, { status: 401 });
    }

    return NextResponse.next();
  };

  // Protect dashboard routes — no token
  if (url.pathname.startsWith("/dashboard") && !token) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  // Redirect authenticated users away from auth pages
  if (url.pathname.startsWith("/auth/") && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect API routes (except /api/auth/*)
  if (
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth/") &&
    !token
  ) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  // Verify JWT for protected routes
  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("JWT_SECRET is not set in environment variables");
        return handleUnauthorized("Server configuration error");
      }

      const encodedSecret = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, encodedSecret);
      const { userId, role } = payload as CustomJWTPayload;

      // Add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set("X-User-Id", userId ?? "");
      response.headers.set("X-User-Role", role ?? "");

      // Set CORS headers on all API responses
      if (url.pathname.startsWith("/api/")) {
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      }

      // Role-based access control for admin routes
      if (url.pathname.startsWith("/dashboard/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return response;
    } catch (error: any) {
      console.error("Token verification error:", error.name, error.message);

      if (error.name === "JWTExpired") {
        // Try to refresh if refresh token exists
        if (refreshToken && url.pathname !== "/api/auth/refresh") {
          const response = NextResponse.rewrite(
            new URL("/api/auth/refresh", req.url),
          );
          response.headers.set("X-Original-Path", req.nextUrl.pathname);
          return response;
        }

        // No refresh token — clear cookie and redirect to login
        const response = NextResponse.redirect(new URL("/auth/login", req.url));
        response.cookies.delete("jwt");
        return response;
      }

      if (
        error.name === "JWTMalformed" ||
        error.name === "JWSSignatureVerificationFailed" ||
        error.name === "JWTInvalid"
      ) {
        const response = NextResponse.redirect(
          new URL("/auth/login?error=invalid_token", req.url),
        );
        response.cookies.delete("jwt");
        return response;
      }

      // Generic JWT error — clear cookie and redirect
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      response.cookies.delete("jwt");
      return response;
    }
  }

  return NextResponse.next();
}

// Non-blocking log helper
function logAuthAttempt(url: string, hasToken: boolean) {
  console.log(
    `Auth attempt: ${url} - Token present: ${hasToken} - ${new Date().toISOString()}`,
  );
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*", "/auth/:path*"],
};
