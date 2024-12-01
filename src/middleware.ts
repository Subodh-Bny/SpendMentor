import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { JWTPayload, jwtVerify } from "jose";

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  role: string;
  exp?: number;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("jwt")?.value;
  const url = req.nextUrl.clone();

  if (url.pathname === "/" && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (url.pathname === "/" && !token) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const handleUnauthorized = (message: string) => {
    if (url.pathname.startsWith("/dashboard")) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ message }, { status: 401 });
    }
    return NextResponse.next();
  };

  if (url.pathname.startsWith("/dashboard") && !token) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  if (url.pathname.startsWith("/auth/") && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth/") &&
    !token
  ) {
    return handleUnauthorized("Unauthorized - No Token Provided");
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const decoded = (await jwtVerify(token, secret)) as {
        payload: CustomJWTPayload;
      };
      const { userId, exp } = decoded.payload;
      if (exp && Date.now() >= exp * 1000) {
        const response = NextResponse.redirect(new URL("/auth/login", req.url));

        response.cookies.delete("jwt");

        return response;
      }

      const response = NextResponse.next();
      response.headers.set("X-User-Id", userId);
      return response;
    } catch (error) {
      console.error("Token verification error:", error);
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/auth/:path*", "/"],
};
