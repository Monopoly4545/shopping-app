import type { PaymentMethod, ShippingAddress } from "@/types/orders";
import { isPaymentMethod } from "@/types/orders";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9()\-\s]{6,30}$/;

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(
  value: unknown,
  label: string,
  minLength: number,
  maxLength: number
): ValidationResult<string> {
  const text = readText(value);

  if (text.length < minLength) {
    return { ok: false, error: `${label} is required.` };
  }

  if (text.length > maxLength) {
    return { ok: false, error: `${label} is too long.` };
  }

  return { ok: true, value: text };
}

function optionalText(
  value: unknown,
  label: string,
  maxLength: number
): ValidationResult<string | undefined> {
  const text = readText(value);

  if (!text) {
    return { ok: true, value: undefined };
  }

  if (text.length > maxLength) {
    return { ok: false, error: `${label} is too long.` };
  }

  return { ok: true, value: text };
}

export function parseEmail(value: unknown): ValidationResult<string> {
  const text = readText(value).toLowerCase();

  if (!EMAIL_PATTERN.test(text) || text.length > 254) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  return { ok: true, value: text };
}

export function parseShippingAddress(
  value: unknown
): ValidationResult<ShippingAddress> {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "A shipping address is required." };
  }

  const input = value as Record<string, unknown>;

  const fullName = requiredText(input.fullName, "Full name", 2, 120);
  if (!fullName.ok) return fullName;

  const phone = readText(input.phone);
  if (!PHONE_PATTERN.test(phone)) {
    return {
      ok: false,
      error: "Please enter a valid phone number.",
    };
  }

  const line1 = requiredText(input.line1, "Address line 1", 3, 200);
  if (!line1.ok) return line1;

  const line2 = optionalText(input.line2, "Address line 2", 200);
  if (!line2.ok) return line2;

  const city = requiredText(input.city, "City", 2, 100);
  if (!city.ok) return city;

  const state = optionalText(input.state, "State / region", 100);
  if (!state.ok) return state;

  const postalCode = optionalText(input.postalCode, "Postal code", 30);
  if (!postalCode.ok) return postalCode;

  const country = requiredText(input.country, "Country", 2, 100);
  if (!country.ok) return country;

  return {
    ok: true,
    value: {
      fullName: fullName.value,
      phone,
      line1: line1.value,
      line2: line2.value,
      city: city.value,
      state: state.value,
      postalCode: postalCode.value,
      country: country.value,
    },
  };
}

export type CheckoutItemInput = {
  productId: number;
  quantity: number;
};

export function parseCheckoutItems(
  value: unknown
): ValidationResult<CheckoutItemInput[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  if (value.length > 50) {
    return { ok: false, error: "Your cart contains too many products." };
  }

  const totals = new Map<number, number>();

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "One of your cart items is invalid." };
    }

    const item = entry as { productId?: unknown; quantity?: unknown };
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      return { ok: false, error: "One of your cart items is invalid." };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return {
        ok: false,
        error: "Product quantities must be between 1 and 99.",
      };
    }

    const nextQuantity = (totals.get(productId) ?? 0) + quantity;

    if (nextQuantity > 99) {
      return {
        ok: false,
        error: "Product quantities must be between 1 and 99.",
      };
    }

    totals.set(productId, nextQuantity);
  }

  return {
    ok: true,
    value: Array.from(totals, ([productId, quantity]) => ({
      productId,
      quantity,
    })),
  };
}

export function parsePaymentMethod(
  value: unknown
): ValidationResult<PaymentMethod> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: "cod" };
  }

  const method = readText(value);

  if (!isPaymentMethod(method)) {
    return { ok: false, error: "Please choose a valid payment method." };
  }

  return { ok: true, value: method };
}

export function parseNotes(value: unknown): ValidationResult<string | null> {
  const text = readText(value);

  if (!text) {
    return { ok: true, value: null };
  }

  if (text.length > 500) {
    return { ok: false, error: "Order notes must be 500 characters or less." };
  }

  return { ok: true, value: text };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
