import type { GuestCartItem } from "@/lib/user/queries";

const MAX_ITEMS = 200;
const MAX_QUANTITY = 99;

/**
 * Validates the guest cart a browser sends during login or registration.
 * Anything malformed is dropped rather than rejecting the whole request.
 */
export function parseGuestCart(value: unknown): GuestCartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_ITEMS).flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const item = entry as {
      productId?: unknown;
      quantity?: unknown;
    };

    const productId = Number(item.productId);
    const quantity = Number(item.quantity ?? 1);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return [];
    }

    return [
      {
        productId,
        quantity: Math.min(MAX_QUANTITY, quantity),
      },
    ];
  });
}

export function parseGuestFavoriteIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value.slice(0, MAX_ITEMS).flatMap((entry) => {
    const id = Number(entry);

    return Number.isInteger(id) && id > 0 ? [id] : [];
  });

  return Array.from(new Set(ids));
}
