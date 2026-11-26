import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { isOrderStatus, listAdminOrders } from "@/lib/admin/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const status = new URL(request.url).searchParams.get("status");

  if (status !== null && !isOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  try {
    const orders = await listAdminOrders(status ?? undefined);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders GET error:", error);

    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 }
    );
  }
}
