import type { UserRole } from "@/lib/auth/types";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
  total: number;
  itemCount: number;
  createdAt: string;
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

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
