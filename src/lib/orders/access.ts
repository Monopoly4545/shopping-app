import { cookies } from "next/headers";

const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function orderAccessCookieName(orderId: string): string {
  return `order_access_${orderId}`;
}

export async function setOrderAccessCookie(
  orderId: string,
  token: string
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(orderAccessCookieName(orderId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
}

export async function getOrderAccessToken(
  orderId: string
): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(orderAccessCookieName(orderId))?.value ?? null;
}
