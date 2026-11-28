import type { UserRole } from "@/lib/auth/types";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
  ShippingStatus,
} from "@/types/orders";

export { ORDER_STATUSES, isOrderStatus } from "@/types/orders";
export type { OrderStatus } from "@/types/orders";

export type AdminProduct = {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  isNew: boolean;
  isSale: boolean;
};

export type AdminCategory = {
  id: number;
  name: string;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: number | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminOrderPayment = {
  id: string;
  provider: PaymentMethod;
  transactionId: string | null;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export type AdminOrderShipping = {
  trackingNumber: string | null;
  courier: string | null;
  status: ShippingStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export type AdminOrderDetail = AdminOrder & {
  customerPhone: string | null;
  subtotal: number;
  shippingFee: number;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  items: AdminOrderItem[];
  payment: AdminOrderPayment | null;
  shipping: AdminOrderShipping | null;
};

export type AdminCustomer = {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  categoryId: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  isNew: boolean;
  isSale: boolean;
};

export type AdminStats = {
  revenue: number;
  orders: number;
  activeOrders: number;
  customers: number;
  newCustomers: number;
  products: number;
  averageOrderValue: number;
};

export type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};

export type StatusBreakdown = {
  status: OrderStatus;
  count: number;
};
