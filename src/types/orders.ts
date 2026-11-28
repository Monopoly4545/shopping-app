export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cod",
  "stripe",
  "paypal",
  "kbzpay",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SHIPPING_STATUSES = [
  "pending",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export type OrderItem = {
  id: string;
  productId: number | null;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type OrderPayment = {
  id: string;
  provider: PaymentMethod;
  transactionId: string | null;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export type OrderShipping = {
  trackingNumber: string | null;
  courier: string | null;
  status: ShippingStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type CustomerOrder = CustomerOrderSummary & {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotal: number;
  shippingFee: number;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  items: OrderItem[];
  payment: OrderPayment | null;
  shipping: OrderShipping | null;
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isShippingStatus(value: string): value is ShippingStatus {
  return (SHIPPING_STATUSES as readonly string[]).includes(value);
}
