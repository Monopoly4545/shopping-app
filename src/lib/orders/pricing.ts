export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_FEE = 5.99;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * The cart page and the server both use this helper so the price shown to the
 * customer is always the price stored on the order.
 */
export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return STANDARD_SHIPPING_FEE;
}

export function calculateOrderTotals(subtotal: number) {
  const roundedSubtotal = roundMoney(subtotal);
  const shippingFee = calculateShipping(roundedSubtotal);

  return {
    subtotal: roundedSubtotal,
    shippingFee,
    total: roundMoney(roundedSubtotal + shippingFee),
  };
}
