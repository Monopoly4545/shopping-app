import type { PaymentMethod } from "@/types/orders";

export type PaymentMethodConfig = {
  id: PaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
  badge?: string;
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay in cash when your order arrives at your door.",
    enabled: true,
    badge: "Available now",
  },
  {
    id: "stripe",
    label: "Card via Stripe",
    description: "Credit and debit cards through a secure hosted checkout.",
    enabled: false,
    badge: "Coming soon",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay with your PayPal balance or a linked card.",
    enabled: false,
    badge: "Coming soon",
  },
  {
    id: "kbzpay",
    label: "KBZPay",
    description: "Mobile wallet payments for customers in Myanmar.",
    enabled: false,
    badge: "Coming soon",
  },
];

export function getPaymentMethodConfig(
  method: PaymentMethod
): PaymentMethodConfig {
  return PAYMENT_METHODS.find((item) => item.id === method) ?? PAYMENT_METHODS[0];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return getPaymentMethodConfig(method).label;
}
