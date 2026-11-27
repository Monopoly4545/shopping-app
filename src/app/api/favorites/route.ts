import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "@/lib/user/queries";

export const runtime = "nodejs";

function unauthorised() {
  return NextResponse.json(
    { error: "Please sign in to save favorites." },
    { status: 401 }
  );
}

function toProductId(value: unknown): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
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
    return NextResponse.json({ favorites: await getFavorites(user.id) });
  } catch (error) {
    console.error("Load favorites error:", error);

    return NextResponse.json(
      { error: "Failed to load your favorites." },
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

  if (productId === null) {
    return NextResponse.json(
      { error: "A valid product is required." },
      { status: 400 }
    );
  }

  try {
    await addFavorite(user.id, productId);

    return NextResponse.json({ favorites: await getFavorites(user.id) });
  } catch (error) {
    if (isMissingProduct(error)) {
      return NextResponse.json(
        { error: "That product could not be found." },
        { status: 404 }
      );
    }

    console.error("Add favorite error:", error);

    return NextResponse.json(
      { error: "Failed to update your favorites." },
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
    await removeFavorite(user.id, productId);

    return NextResponse.json({ favorites: await getFavorites(user.id) });
  } catch (error) {
    console.error("Remove favorite error:", error);

    return NextResponse.json(
      { error: "Failed to update your favorites." },
      { status: 500 }
    );
  }
}
