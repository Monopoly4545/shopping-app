import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import RecentOrders from "@/components/admin/RecentOrders";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  getAdminStats,
  getOrderStatusBreakdown,
  getTopProducts,
  listAdminOrders,
} from "@/lib/admin/queries";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const quickActions = [
  {
    href: "/admin/products",
    title: "Add a product",
    description: "Create or update catalog items",
    icon: Package,
  },
  {
    href: "/admin/orders",
    title: "Manage orders",
    description: "Update fulfillment statuses",
    icon: ShoppingBag,
  },
  {
    href: "/admin/customers",
    title: "Review customers",
    description: "See accounts and spending",
    icon: Users,
  },
  {
    href: "/admin/analytics",
    title: "Open analytics",
    description: "Track revenue and trends",
    icon: BarChart3,
  },
];

export default async function AdminOverviewPage() {
  const user = await requireAdminPage("/admin");

  const [stats, recentOrders, topProducts, statusBreakdown] = await Promise.all([
    getAdminStats(),
    listAdminOrders(undefined, 6),
    getTopProducts(4),
    getOrderStatusBreakdown(),
  ]);

  const maxStatus = Math.max(...statusBreakdown.map((item) => item.count), 1);
  const firstName = (user.fullName || user.email).split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome back, {firstName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here is what is happening in your store today.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Package size={17} />
          Add product
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.revenue)}
          hint={`${formatCurrency(stats.averageOrderValue)} average order`}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Orders"
          value={String(stats.orders)}
          hint={`${stats.activeOrders} awaiting action`}
          icon={ShoppingBag}
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
          label="Products"
          value={String(stats.products)}
          hint="Live in the catalog"
          icon={Package}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="rounded-xl bg-gray-50 p-3 text-gray-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  {action.title}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {action.description}
                </span>
              </span>
              <ArrowRight
                size={16}
                className="text-gray-300 transition group-hover:text-blue-500"
              />
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">
                Order pipeline
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {statusBreakdown.map((item) => (
                <div key={item.status}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-semibold text-gray-700">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.max((item.count / maxStatus) * 100, 2)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Top products</h2>
            <p className="text-xs text-gray-500">
              By revenue from paid orders
            </p>

            {topProducts.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">
                Product performance appears once orders come in.
              </p>
            ) : (
              <ol className="mt-4 space-y-4">
                {topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} sold
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
