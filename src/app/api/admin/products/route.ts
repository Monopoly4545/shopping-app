import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import {
  createAdminProduct,
  listAdminCategories,
  listAdminProducts,
} from "@/lib/admin/queries";
import { parseProductInput } from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  try {
    const [products, categories] = await Promise.all([
      listAdminProducts(),
      listAdminCategories(),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Admin products GET error:", error);

    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = parseProductInput(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const id = await createAdminProduct(parsed.value);

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);

    const code = (error as { code?: string }).code;

    if (code === "23503") {
      return NextResponse.json(
        { error: "The selected category does not exist." },
        { status: 400 }
      );
    }

    if (code === "23505") {
      return NextResponse.json(
        { error: "A product with that id already exists. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
