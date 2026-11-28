import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Package,
  Search,
  ShoppingBag,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { listCustomerOrders } from "@/lib/orders/queries";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/StatusBadges";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  const orders = await listCustomerOrders(user.id);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              My account
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">My orders</h1>
            <p className="mt-2 text-gray-500">
              Track deliveries, review past purchases and check payment status.
            </p>
          </div>

          <Link
            href="/orders/lookup"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            <Search size={17} />
            Track a guest order
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center">
            <span className="rounded-full bg-blue-50 p-5 text-blue-600">
              <ShoppingBag size={40} />
            </span>
            <h2 className="mt-6 text-xl font-bold">No orders yet</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              When you place an order it will appear here with its payment and
              delivery status.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package size={22} />
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">{order.orderNumber}</h2>
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>

                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <CalendarDays size={15} />
                        {formatDate(order.createdAt)}
                        <span className="text-gray-300">•</span>
                        {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Total
                      </p>
                      <p className="text-lg font-bold">
                        {formatCurrency(order.total)}
                      </p>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                    >
                      View
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
