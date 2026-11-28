/**
 * Lightweight CSRF defence for browser mutations. Requests without an Origin
 * header (server-to-server, curl, native apps) are allowed because they cannot
 * ride on a victim's cookies from another site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}
