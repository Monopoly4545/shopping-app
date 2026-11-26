import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Keep this in sync with src/lib/auth/session.ts. It is duplicated on purpose:
// importing the session module would pull database/next-headers code into the
// proxy bundle.
const SESSION_COOKIE = "session";

/**
 * Optimistic auth check only. The proxy verifies that a session cookie exists,
 * then the admin layout and every /api/admin route handler verify the user's
 * role against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
