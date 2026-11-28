import Link from "next/link";
import { ArrowLeft, Mail, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Enter both your order number and the email used at checkout.",
  "not-found":
    "We could not find an order with that order number and email. Please check both and try again.",
  server: "Something went wrong while looking up your order. Please try again.",
};

export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? errorMessages[error] : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-lg">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          My orders
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Search size={22} />
          </span>

          <h1 className="mt-5 text-2xl font-bold">Track a guest order</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the order number from your confirmation and the email address
            you used at checkout. We will reopen your order details on this
            browser.
          </p>

          {message && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {message}
            </div>
          )}

          <form action="/api/orders/lookup" method="post" className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Order number
              </span>
              <input
                name="orderNumber"
                required
                placeholder="SE-100001"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </span>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              <Search size={18} />
              Find my order
            </button>
          </form>

          <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
            Have an account?{" "}
            <Link
              href="/login?next=/orders"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>{" "}
            to see all of your orders.
          </p>
        </div>
      </div>
    </div>
  );
}
