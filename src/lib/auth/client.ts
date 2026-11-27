import type { AuthUser } from "@/lib/auth/types";

/**
 * Name of the browser event used to tell client components (such as the
 * Navbar, cart and favorites) that the signed-in user has changed.
 */
export const AUTH_CHANGE_EVENT = "shopease:auth-change";

/**
 * The user returned by the most recent login/registration/logout. Keeping it
 * here lets the Navbar update immediately instead of racing a /api/auth/me
 * request against the navigation that follows sign-in.
 */
let cachedUser: AuthUser | null | undefined;

export function getCachedAuthUser(): AuthUser | null | undefined {
  return cachedUser;
}

export function setAuthUser(user: AuthUser | null): void {
  cachedUser = user;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}
