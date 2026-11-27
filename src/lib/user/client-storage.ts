import type { GuestCartItem } from "@/lib/user/queries";

export const GUEST_CART_KEY = "shopease-cart";
export const GUEST_FAVORITES_KEY = "favorites";

/**
 * Guest data stays in Local Storage until the customer signs in. These helpers
 * read it in the shape the server needs to merge it into the account.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseArray(raw: string | null): unknown[] {
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function toProductId(value: unknown): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export function readGuestCartForMerge(): GuestCartItem[] {
  if (!isBrowser()) {
    return [];
  }

  const items = parseArray(localStorage.getItem(GUEST_CART_KEY));

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as {
      productId?: unknown;
      product?: { id?: unknown };
      quantity?: unknown;
    };

    const productId = toProductId(record.productId ?? record.product?.id);
    const quantity = Number(record.quantity ?? 1);

    if (productId === null || !Number.isInteger(quantity) || quantity < 1) {
      return [];
    }

    return [{ productId, quantity: Math.min(99, quantity) }];
  });
}

export function readGuestFavoriteIdsForMerge(): number[] {
  if (!isBrowser()) {
    return [];
  }

  const items = parseArray(localStorage.getItem(GUEST_FAVORITES_KEY));

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as { id?: unknown; productId?: unknown };
    const productId = toProductId(record.productId ?? record.id);

    return productId === null ? [] : [productId];
  });
}

export function clearGuestShoppingData(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_FAVORITES_KEY);
}
