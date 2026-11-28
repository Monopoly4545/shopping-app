import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { setOrderAccessCookie } from "@/lib/orders/access";
import {
  createOrder,
  listCustomerOrders,
  OrderError,
} from "@/lib/orders/queries";
import {
  parseCheckoutItems,
  parseEmail,
  parseNotes,
  parsePaymentMethod,
  parseShippingAddress,
} from "@/lib/orders/validation";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to view your orders." },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({ orders: await listCustomerOrders(user.id) });
  } catch (error) {
    console.error("Load orders error:", error);

    return NextResponse.json(
      { error: "Failed to load your orders." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "A valid checkout request is required." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  const address = parseShippingAddress(input.shippingAddress);
  if (!address.ok) {
    return NextResponse.json({ error: address.error }, { status: 400 });
  }

  const paymentMethod = parsePaymentMethod(input.paymentMethod);
  if (!paymentMethod.ok) {
    return NextResponse.json({ error: paymentMethod.error }, { status: 400 });
  }

  const notes = parseNotes(input.notes);
  if (!notes.ok) {
    return NextResponse.json({ error: notes.error }, { status: 400 });
  }

  let guestEmail: string | null = null;
  let guestItems: ReturnType<typeof parseCheckoutItems> | null = null;

  if (!user) {
    const email = parseEmail(input.email);
    if (!email.ok) {
      return NextResponse.json({ error: email.error }, { status: 400 });
    }

    guestEmail = email.value;
    guestItems = parseCheckoutItems(input.items);

    if (!guestItems.ok) {
      return NextResponse.json({ error: guestItems.error }, { status: 400 });
    }
  }

  try {
    const { order, accessToken } = await createOrder({
      user,
      guestEmail,
      guestItems: guestItems?.ok ? guestItems.value : null,
      shippingAddress: address.value,
      paymentMethod: paymentMethod.value,
      notes: notes.value,
    });

    if (!user) {
      await setOrderAccessCookie(order.id, accessToken);
    }

    return NextResponse.json(
      {
        order,
        redirectUrl: `/orders/${order.id}?placed=1`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Create order error:", error);

    return NextResponse.json(
      { error: "We could not place your order. Please try again." },
      { status: 500 }
    );
  }
}
