import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import {
  deleteAdminProduct,
  updateAdminProduct,
} from "@/lib/admin/queries";
import { parseProductInput } from "@/lib/admin/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseProductInput(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const updated = await updateAdminProduct(productId, parsed.value);

    if (!updated) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin products PATCH error:", error);

    if ((error as { code?: string }).code === "23503") {
      return NextResponse.json(
        { error: "The selected category does not exist." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  try {
    const deleted = await deleteAdminProduct(productId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin products DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
