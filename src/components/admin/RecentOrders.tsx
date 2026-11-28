import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

import type { AdminOrder } from "@/types/admin";
import StatusBadge from "@/components/admin/StatusBadge";
import { PaymentStatusBadge } from "@/components/orders/StatusBadges";

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
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function RecentOrders({ orders }: { orders: AdminOrder[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Recent orders</h2>
          <p className="text-xs text-gray-500">Latest activity in your store</p>
        </div>

        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="rounded-full bg-gray-100 p-4 text-gray-400">
            <ShoppingBag size={28} />
          </span>
          <p className="mt-4 font-semibold text-gray-800">No orders yet</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Orders will appear here as soon as customers start checking out.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-right font-semibold">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customerEmail}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </td>

                  <td className="px-5 py-4 text-right text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
