"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import type { AdminCustomer } from "@/types/admin";

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
  }).format(new Date(value));
}

function initials(customer: AdminCustomer) {
  const source = customer.fullName?.trim() || customer.email;

  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function CustomersManager({
  currentUserId,
  initialCustomers,
}: {
  currentUserId: string;
  initialCustomers: AdminCustomer[];
}) {
  const [customers, setCustomers] = useState<AdminCustomer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load customers.");
      }

      setCustomers(data.customers ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers."
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      `${customer.fullName ?? ""} ${customer.email} ${customer.role}`
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  const adminCount = customers.filter(
    (customer) => customer.role === "admin"
  ).length;

  async function updateRole(customer: AdminCustomer, role: "admin" | "customer") {
    if (role === customer.role) {
      return;
    }

    const label = customer.fullName || customer.email;
    const confirmed = window.confirm(
      role === "admin"
        ? `Give ${label} full admin access?`
        : `Remove admin access from ${label}?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(customer.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update customer.");
      }

      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id ? { ...item, role } : item
        )
      );
      setSuccess(
        `${label} is now ${role === "admin" ? "an administrator" : "a customer"}.`
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update customer."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="mt-1 text-sm text-gray-500">
            View accounts, spending and admin access.
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total accounts</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {customers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Customers</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {customers.length - adminCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Administrators</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
            {adminCount}
            <ShieldCheck size={20} className="text-blue-600" />
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or role..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <p className="text-sm text-gray-500">
            {filtered.length} of {customers.length} accounts
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="rounded-full bg-gray-100 p-4 text-gray-400">
              <Users size={30} />
            </span>
            <p className="mt-4 font-semibold text-gray-800">
              No customers found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try a different search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 text-right font-semibold">Orders</th>
                  <th className="px-5 py-3 text-right font-semibold">Spent</th>
                  <th className="px-5 py-3 text-right font-semibold">Joined</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((customer) => {
                  const isSelf = customer.id === currentUserId;

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              customer.role === "admin"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {initials(customer) || (
                              <UserRound size={18} />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold text-gray-900">
                              <span className="truncate">
                                {customer.fullName || "Unnamed customer"}
                              </span>
                              {isSelf && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={customer.role}
                          disabled={isSelf || updatingId === customer.id}
                          title={
                            isSelf
                              ? "You cannot change your own role."
                              : "Change account role"
                          }
                          onChange={(event) =>
                            void updateRole(
                              customer,
                              event.target.value as "admin" | "customer"
                            )
                          }
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold capitalize text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-gray-800">
                        {customer.orderCount}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        You cannot change your own role, and the last remaining administrator
        cannot be demoted.
      </p>
    </div>
  );
}
