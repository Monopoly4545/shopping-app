import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/same-origin";
import { getOrderAccessToken } from "@/lib/orders/access";
import {
  cancelCustomerOrder,
  getCustomerOrder,
} from "@/lib/orders/queries";
import { isUuid } from "@/lib/orders/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  const cookieToken = await getOrderAccessToken(id);
  const queryToken = new URL(request.url).searchParams.get("token");

  try {
    const order = await getCustomerOrder(id, {
      userId: user?.id,
      accessToken: cookieToken ?? queryToken,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Load order error:", error);

    return NextResponse.json(
      { error: "Failed to load this order." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to manage this order." },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  if (body?.action !== "cancel") {
    return NextResponse.json(
      { error: "Unsupported order action." },
      { status: 400 }
    );
  }

  try {
    const cancelled = await cancelCustomerOrder(id, user.id);

    if (!cancelled) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled. Please contact support.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);

    return NextResponse.json(
      { error: "Failed to cancel this order." },
      { status: 500 }
    );
  }
}
