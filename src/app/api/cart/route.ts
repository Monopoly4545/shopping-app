import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  addCartItem,
  getCartItems,
  removeCartItem,
  setCartItemQuantity,
} from "@/lib/user/queries";

export const runtime = "nodejs";

function unauthorised() {
  return NextResponse.json(
    { error: "Please sign in to use your cart." },
    { status: 401 }
  );
}

function invalidProduct() {
  return NextResponse.json(
    { error: "That product could not be found." },
    { status: 404 }
  );
}

function toProductId(value: unknown): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function toQuantity(value: unknown): number | null {
  const quantity = Number(value);

  return Number.isInteger(quantity) ? quantity : null;
}

function isMissingProduct(error: unknown): boolean {
  return (error as { code?: string }).code === "23503";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorised();
  }

  try {
    return NextResponse.json({ items: await getCartItems(user.id) });
  } catch (error) {
    console.error("Load cart error:", error);

    return NextResponse.json(
      { error: "Failed to load your cart." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorised();
  }

  const body = await request.json().catch(() => null);
  const productId = toProductId(body?.productId);
  const quantity = toQuantity(body?.quantity ?? 1);

  if (productId === null || quantity === null || quantity < 1) {
    return NextResponse.json(
      { error: "A valid product and quantity are required." },
      { status: 400 }
    );
  }

  try {
    await addCartItem(user.id, productId, Math.min(99, quantity));

    return NextResponse.json({ items: await getCartItems(user.id) });
  } catch (error) {
    if (isMissingProduct(error)) {
      return invalidProduct();
    }

    console.error("Add to cart error:", error);

    return NextResponse.json(
      { error: "Failed to update your cart." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorised();
  }

  const body = await request.json().catch(() => null);
  const productId = toProductId(body?.productId);
  const quantity = toQuantity(body?.quantity);

  if (productId === null || quantity === null) {
    return NextResponse.json(
      { error: "A valid product and quantity are required." },
      { status: 400 }
    );
  }

  try {
    await setCartItemQuantity(user.id, productId, quantity);

    return NextResponse.json({ items: await getCartItems(user.id) });
  } catch (error) {
    if (isMissingProduct(error)) {
      return invalidProduct();
    }

    console.error("Update cart error:", error);

    return NextResponse.json(
      { error: "Failed to update your cart." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorised();
  }

  const productId = toProductId(
    new URL(request.url).searchParams.get("productId")
  );

  if (productId === null) {
    return NextResponse.json(
      { error: "A valid product is required." },
      { status: 400 }
    );
  }

  try {
    await removeCartItem(user.id, productId);

    return NextResponse.json({ items: await getCartItems(user.id) });
  } catch (error) {
    console.error("Remove from cart error:", error);

    return NextResponse.json(
      { error: "Failed to update your cart." },
      { status: 500 }
    );
  }
}
