import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/http/same-origin";
import { setOrderAccessCookie } from "@/lib/orders/access";
import { findOrderForLookup } from "@/lib/orders/queries";
import { parseEmail } from "@/lib/orders/validation";

export const runtime = "nodejs";

const NOT_FOUND_MESSAGE =
  "We could not find an order with that order number and email.";

function isFormRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";

  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const formRequest = isFormRequest(request);

  let orderNumber = "";
  let rawEmail: unknown = "";

  if (formRequest) {
    const form = await request.formData();
    orderNumber = String(form.get("orderNumber") ?? "").trim();
    rawEmail = form.get("email");
  } else {
    const body = await request.json().catch(() => null);
    orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
    rawEmail = body?.email;
  }

  const email = parseEmail(rawEmail);

  if (!orderNumber || !email.ok) {
    if (formRequest) {
      return NextResponse.redirect(
        new URL("/orders/lookup?error=invalid", request.url),
        303
      );
    }

    return NextResponse.json(
      { error: "Enter your order number and email address." },
      { status: 400 }
    );
  }

  try {
    const found = await findOrderForLookup(orderNumber, email.value);

    if (!found) {
      if (formRequest) {
        return NextResponse.redirect(
          new URL("/orders/lookup?error=not-found", request.url),
          303
        );
      }

      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    await setOrderAccessCookie(found.id, found.accessToken);

    if (formRequest) {
      return NextResponse.redirect(
        new URL(`/orders/${found.id}`, request.url),
        303
      );
    }

    return NextResponse.json({ redirectUrl: `/orders/${found.id}` });
  } catch (error) {
    console.error("Order lookup error:", error);

    if (formRequest) {
      return NextResponse.redirect(
        new URL("/orders/lookup?error=server", request.url),
        303
      );
    }

    return NextResponse.json(
      { error: "We could not look up that order. Please try again." },
      { status: 500 }
    );
  }
}
