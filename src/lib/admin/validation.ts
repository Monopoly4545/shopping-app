import type { ProductInput } from "@/types/admin";
import type { UserRole } from "@/lib/auth/types";

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "on" || value === 1) {
    return true;
  }

  if (value === "false" || value === 0) {
    return false;
  }

  return fallback;
}

export function parseProductInput(body: unknown): ParseResult<ProductInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const input = body as Record<string, unknown>;

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return { ok: false, error: "Product name is required." };
  }

  if (name.length > 255) {
    return { ok: false, error: "Product name must be 255 characters or less." };
  }

  const categoryId = toNumber(input.categoryId);
  if (!categoryId || !Number.isInteger(categoryId) || categoryId <= 0) {
    return { ok: false, error: "Please choose a category." };
  }

  const price = toNumber(input.price);
  if (price === null || price < 0) {
    return { ok: false, error: "Price must be zero or greater." };
  }

  const originalPrice = toNumber(input.originalPrice ?? input.price);
  if (originalPrice === null || originalPrice < 0) {
    return {
      ok: false,
      error: "Original price must be zero or greater.",
    };
  }

  const rating = toNumber(input.rating ?? 0);
  if (rating === null || rating < 0 || rating > 5) {
    return { ok: false, error: "Rating must be between 0 and 5." };
  }

  const reviews = toNumber(input.reviews ?? 0);
  if (reviews === null || !Number.isInteger(reviews) || reviews < 0) {
    return { ok: false, error: "Reviews must be a whole number of zero or more." };
  }

  const image = typeof input.image === "string" ? input.image.trim() : "";
  if (!image) {
    return { ok: false, error: "Image URL is required." };
  }

  return {
    ok: true,
    value: {
      name,
      categoryId,
      price,
      originalPrice,
      rating,
      reviews,
      image,
      isNew: toBoolean(input.isNew),
      isSale: toBoolean(input.isSale),
    },
  };
}

export function parseRole(value: unknown): UserRole | null {
  return value === "admin" || value === "customer" ? value : null;
}
