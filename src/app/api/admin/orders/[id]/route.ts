import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import {
  getAdminOrderDetail,
  isOrderStatus,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
} from "@/lib/admin/queries";
import { isPaymentStatus } from "@/types/orders";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const order = await getAdminOrderDetail(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order GET error:", error);

    return NextResponse.json(
      { error: "Failed to load order." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : null;
  const paymentStatus =
    typeof body?.paymentStatus === "string" ? body.paymentStatus : null;

  if (!status && !paymentStatus) {
    return NextResponse.json(
      { error: "Provide an order status or payment status to update." },
      { status: 400 }
    );
  }

  if (status && !isOrderStatus(status)) {
    return NextResponse.json(
      { error: "Please choose a valid order status." },
      { status: 400 }
    );
  }

  if (paymentStatus && !isPaymentStatus(paymentStatus)) {
    return NextResponse.json(
      { error: "Please choose a valid payment status." },
      { status: 400 }
    );
  }

  try {
    if (status) {
      const updated = await updateAdminOrderStatus(id, status);

      if (!updated) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
    }

    if (paymentStatus) {
      const updated = await updateAdminOrderPaymentStatus(id, paymentStatus);

      if (!updated) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
    }

    const order = await getAdminOrderDetail(id);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin orders PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 }
    );
  }
}
