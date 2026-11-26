import {
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import RevenueChart from "@/components/admin/RevenueChart";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  getAdminStats,
  getOrderStatusBreakdown,
  getRevenueSeries,
  getTopProducts,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

export default async function AdminAnalyticsPage() {
  await requireAdminPage("/admin/analytics");

  const [stats, revenueSeries, topProducts, statusBreakdown] = await Promise.all([
    getAdminStats(),
    getRevenueSeries(14),
    getTopProducts(6),
    getOrderStatusBreakdown(),
  ]);

  const maxStatus = Math.max(...statusBreakdown.map((item) => item.count), 1);
  const topRevenue = Math.max(...topProducts.map((item) => item.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="mt-1 text-sm text-gray-500">
          Sales, revenue and customer performance at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          hint="All non-cancelled orders"
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Average order value"
          value={formatCurrency(stats.averageOrderValue, 2)}
          hint={`${stats.orders} total orders`}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          label="Customers"
          value={String(stats.customers)}
          hint={`${stats.newCustomers} joined in 30 days`}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Active catalog"
          value={String(stats.products)}
          hint={`${stats.activeOrders} orders need action`}
          icon={Package}
          tone="amber"
        />
      </div>

      <RevenueChart data={revenueSeries} />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">
              Best-selling products
            </h3>
          </div>
          <p className="text-xs text-gray-500">By revenue from completed items</p>

          {topProducts.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              Sales data will appear after your first orders.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {topProducts.map((product) => (
                <div key={product.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-gray-800">
                      {product.name}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue, 2)}
                    </p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.max(
                          (product.revenue / topRevenue) * 100,
                          2
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {product.quantity} units sold
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">Order status</h3>
          <p className="text-xs text-gray-500">Current fulfillment pipeline</p>

          <div className="mt-5 space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.status}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-semibold text-gray-700">
                    {item.count}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{
                      width: `${Math.max((item.count / maxStatus) * 100, 2)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">
              Fulfillment health
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {stats.activeOrders === 0
                ? "No orders are waiting for action right now."
                : `${stats.activeOrders} ${
                    stats.activeOrders === 1 ? "order is" : "orders are"
                  } still pending or processing. Update their status from the Orders page as they move.`}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
