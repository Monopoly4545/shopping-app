import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Server-side guard for admin pages. Always call this from the page/layout
 * itself — the proxy only performs the cheap "is a cookie present?" check.
 */
export async function requireAdminPage(nextPath = "/admin"): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return user;
}

export type AdminApiGuard =
  | { user: AuthUser; response?: never }
  | { user?: never; response: NextResponse };

/**
 * Server-side guard for admin API route handlers.
 *
 * Usage:
 *   const auth = await requireAdminApi();
 *   if (auth.response) return auth.response;
 */
export async function requireAdminApi(): Promise<AdminApiGuard> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { user };
}
