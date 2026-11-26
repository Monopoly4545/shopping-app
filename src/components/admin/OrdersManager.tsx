"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";

import { ORDER_STATUSES, type AdminOrder, type OrderStatus } from "@/types/admin";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-violet-200 bg-violet-50 text-violet-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

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

export default function OrdersManager({
  initialOrders,
}: {
  initialOrders: AdminOrder[];
}) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load orders.");
      }

      setOrders(data.orders ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function handleRefresh() {
    setLoading(true);
    setError("");
    setSuccess("");
    void load();
  }

  const counts = useMemo(() => {
    return ORDER_STATUSES.reduce<Record<OrderStatus, number>>(
      (accumulator, status) => {
        accumulator[status] = orders.filter(
          (order) => order.status === status
        ).length;
        return accumulator;
      },
      { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        !query ||
        `${order.orderNumber} ${order.customerName} ${order.customerEmail}`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  async function updateStatus(order: AdminOrder, status: OrderStatus) {
    if (status === order.status) {
      return;
    }

    setUpdatingId(order.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update order.");
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status } : item
        )
      );
      setSuccess(
        `${order.orderNumber} marked as ${statusLabels[status].toLowerCase()}.`
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update order."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review incoming orders and move them through fulfillment.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              statusFilter === status
                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-xs font-medium text-gray-500">
              {statusLabels[status]}
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {counts[status]}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All orders ({orders.length})
            </button>
          </div>

          <div className="relative w-full max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number, customer or email..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="rounded-full bg-gray-100 p-4 text-gray-400">
              <ShoppingBag size={30} />
            </span>
            <p className="mt-4 font-semibold text-gray-800">No orders found</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {orders.length === 0
                ? "Orders will appear here once customers check out."
                : "Try changing the status filter or search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Placed</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.id.slice(0, 8)}
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

                    <td className="px-5 py-4 text-gray-600">
                      {order.itemCount}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(event) =>
                          void updateStatus(
                            order,
                            event.target.value as OrderStatus
                          )
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize outline-none transition focus:ring-2 focus:ring-blue-100 disabled:opacity-60 ${statusStyles[order.status]}`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
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
      </div>
    </div>
  );
}
