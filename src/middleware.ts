import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import routes from "./config/routes";

export async function middleware(request: NextRequest) {
  const token = null;
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
  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/", "/dashboard/:path*"],
};
