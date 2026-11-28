import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { getOrderAccessToken } from "@/lib/orders/access";
import { getCustomerOrder } from "@/lib/orders/queries";
import { isUuid, parsePaymentMethod } from "@/lib/orders/validation";
import {
  PaymentUnavailableError,
  startPaymentSession,
} from "@/lib/payments/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const provider = parsePaymentMethod(body?.provider);

  if (!isUuid(orderId) || !provider.ok) {
    return NextResponse.json(
      { error: "A valid order and payment method are required." },
      { status: 400 }
    );
  }

  const accessToken = await getOrderAccessToken(orderId);

  try {
    const order = await getCustomerOrder(orderId, {
      userId: user?.id,
      accessToken,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "This order has been cancelled." },
        { status: 409 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order is already paid." },
        { status: 409 }
      );
    }

    const session = await startPaymentSession({
      orderId: order.id,
      provider: provider.value,
    });

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof PaymentUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }

    console.error("Create payment session error:", error);

    return NextResponse.json(
      { error: "We could not start the payment. Please try again." },
      { status: 500 }
    );
  }
}
