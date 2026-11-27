/**
 * Name of the browser event used to tell client components (such as the
 * Navbar) that the signed-in user has changed and the session should be
 * re-fetched.
 */
export const AUTH_CHANGE_EVENT = "shopease:auth-change";

export function notifyAuthChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
