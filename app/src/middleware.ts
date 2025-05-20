import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWTPayload, jwtVerify } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: string;
  exp?: number;
}

export async function middleware(
  req: NextRequest,
  context: { waitUntil: (promise: Promise<any>) => void }
) {
  const token = req.cookies.get("jwt")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const url = req.nextUrl.clone();

  // Log authentication attempts without blocking the response
  context.waitUntil(
    logAuthAttempt(req.url, !!token).catch((error) =>
      console.error("Logging error:", error)
    )
  );

  // Handle public routes
  if (url.pathname === "/" && token) {
    // If authenticated at root, rewrite to dashboard to preserve URL
    return NextResponse.rewrite(new URL("/dashboard", req.url));
  }

  if (url.pathname === "/" && !token) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Handle unauthorized access
  const handleUnauthorized = (message: string) => {
    if (url.pathname.startsWith("/dashboard")) {
      // Store the original URL to redirect back after login
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ message }, { status: 401 });
    }

    return NextResponse.next();
  };

  // Protect dashboard routes
  if (url.pathname.startsWith("/dashboard") && !token) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  // Redirect authenticated users away from auth pages
  if (url.pathname.startsWith("/auth/") && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect API routes
  if (
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth/") &&
    !token
  ) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  // Verify token for protected routes
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const decoded = (await jwtVerify(token, secret)) as {
        payload: CustomJWTPayload;
      };

      const { userId, role, exp } = decoded.payload;

      // Check if token is expired
      if (exp && Date.now() >= exp * 1000) {
        // Try to refresh the token if refresh token exists
        if (refreshToken && url.pathname !== "/api/auth/refresh") {
          // Store the original URL to redirect back after refresh
          const originalPath = req.nextUrl.pathname;

          // Rewrite to the refresh endpoint
          const response = NextResponse.rewrite(
            new URL("/api/auth/refresh", req.url)
          );

          // Add the original path as a header
          response.headers.set("X-Original-Path", originalPath);
          return response;
        }

        // If no refresh token, redirect to login
        const response = NextResponse.redirect(new URL("/auth/login", req.url));
        response.cookies.delete("jwt");
        return response;
      }

      // Add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set("X-User-Id", userId);
      response.headers.set("X-User-Role", role);

      // Role-based access control
      if (url.pathname.startsWith("/dashboard/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return response;
    } catch (error: any) {
      console.error("Token verification error:", error);

      // Handle different types of JWT errors
      if (error.name === "JWTExpired") {
        // Token expired
        const response = NextResponse.redirect(new URL("/auth/login", req.url));
        response.cookies.delete("jwt");
        return response;
      } else if (
        error.name === "JWTMalformed" ||
        error.name === "JWSSignatureVerificationFailed"
      ) {
        // Invalid token
        const response = NextResponse.redirect(
          new URL("/auth/login?error=invalid_token", req.url)
        );
        response.cookies.delete("jwt");
        return response;
      }

      // Generic error
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      return response;
    }
  }

  return NextResponse.next();
}

// Async logging function that won't block the response
async function logAuthAttempt(url: string, hasToken: boolean) {
  // In a real app, this would log to a database or monitoring service
  console.log(
    `Auth attempt: ${url} - Token present: ${hasToken} - ${new Date().toISOString()}`
  );
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*", "/auth/:path*"],
};
