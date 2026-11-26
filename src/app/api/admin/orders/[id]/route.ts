import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { isOrderStatus, updateAdminOrderStatus } from "@/lib/admin/queries";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!isOrderStatus(status)) {
    return NextResponse.json(
      { error: "Please choose a valid order status." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateAdminOrderStatus(id, status);

    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin orders PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 }
    );
  }
}
