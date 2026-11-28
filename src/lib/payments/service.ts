import type { PaymentMethod } from "@/types/orders";
import { getPaymentMethodLabel } from "@/lib/payments/providers";

export class PaymentUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentUnavailableError";
  }
}

/**
 * Starts a payment session for an order.
 *
 * Cash on Delivery needs no external provider: the order and its pending
 * payment record already exist, so the customer can go straight to the
 * confirmation page. Online providers are wired in here later; they must
 * create their session on the server and return a hosted checkout URL.
 */
export async function startPaymentSession({
  orderId,
  provider,
}: {
  orderId: string;
  provider: PaymentMethod;
}): Promise<{ redirectUrl: string }> {
  if (provider === "cod") {
    return { redirectUrl: `/orders/${orderId}?placed=1` };
  }

  throw new PaymentUnavailableError(
    `${getPaymentMethodLabel(provider)} is not configured yet. Please choose Cash on Delivery.`
  );
}
