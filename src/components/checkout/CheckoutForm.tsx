"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { PAYMENT_METHODS } from "@/lib/payments/providers";
import type { PaymentMethod } from "@/types/orders";

type CheckoutUser = {
  email: string;
  fullName: string | null;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

const paymentIcons = {
  cod: Banknote,
  stripe: CreditCard,
  paypal: Wallet,
  kbzpay: Smartphone,
} as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function CheckoutForm({ user }: { user: CheckoutUser | null }) {
  const router = useRouter();
  const { cart, cartTotal, clearCart, loading } = useCart();

  const [form, setForm] = useState<FormState>({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Myanmar",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totals = calculateOrderTotals(cartTotal);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.country.trim()
    ) {
      setError("Please complete all required shipping fields.");
      return;
    }

    if (!user && !form.email.trim()) {
      setError("Please enter your email address so we can send your receipt.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user ? undefined : form.email.trim(),
          items: user
            ? undefined
            : cart.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
              })),
          shippingAddress: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim() || undefined,
            postalCode: form.postalCode.trim() || undefined,
            country: form.country.trim(),
          },
          paymentMethod,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "We could not place your order.");
      }

      clearCart();
      router.push(data.redirectUrl ?? `/orders/${data.order?.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not place your order. Please try again."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        Loading your cart...
      </div>
    );
  }

  if (cart.length === 0 && !submitting) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full bg-blue-50 p-8 text-blue-600">
          <ShoppingBag size={64} />
        </div>

        <h1 className="mt-8 text-3xl font-bold">Your cart is empty</h1>

        <p className="mt-3 max-w-md text-gray-500">
          Add a few products to your cart before heading to checkout.
        </p>

        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to cart
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Checkout</h1>
            <p className="mt-2 text-gray-500">
              Enter your delivery details and choose how you would like to pay.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={17} />
            Secure checkout
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1.5fr_1fr]"
        >
          <div className="space-y-6">
            {!user && (
              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
                <p className="font-semibold">Checking out as a guest</p>
                <p className="mt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login?next=/checkout"
                    className="font-semibold underline"
                  >
                    Sign in
                  </Link>{" "}
                  to keep your cart and order history in one place.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Shipping details</h2>
                  <p className="text-sm text-gray-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full name *
                  </span>
                  <input
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Aung Aung"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address {user ? "" : "*"}
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    autoComplete="email"
                    required={!user}
                    disabled={Boolean(user)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone number *
                  </span>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    autoComplete="tel"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="+95 9 123 456 789"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Address line 1 *
                  </span>
                  <input
                    value={form.line1}
                    onChange={(event) =>
                      updateField("line1", event.target.value)
                    }
                    autoComplete="address-line1"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="House number and street"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Address line 2
                  </span>
                  <input
                    value={form.line2}
                    onChange={(event) =>
                      updateField("line2", event.target.value)
                    }
                    autoComplete="address-line2"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Apartment, suite, landmark (optional)"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    City *
                  </span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    autoComplete="address-level2"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Yangon"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    State / region
                  </span>
                  <input
                    value={form.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    autoComplete="address-level1"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Yangon Region"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Postal code
                  </span>
                  <input
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                    autoComplete="postal-code"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="11011"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Country *
                  </span>
                  <input
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    autoComplete="country-name"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Myanmar"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Payment method</h2>
                  <p className="text-sm text-gray-500">
                    We never store card numbers or CVV codes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = paymentIcons[method.id];
                  const selected = paymentMethod === method.id;

                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                        selected
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      } ${method.enabled ? "" : "cursor-not-allowed opacity-60"}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selected}
                        disabled={!method.enabled}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />

                      <Icon size={22} className="mt-0.5 text-gray-700" />

                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {method.label}
                          </span>
                          {method.badge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                method.enabled
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {method.badge}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          {method.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Order notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField("notes", event.target.value)
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Delivery instructions or a gift message (optional)"
                />
              </label>
            </section>
          </div>

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Order summary</h2>

              <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.quantity} ×{" "}
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>
                    {totals.shippingFee === 0
                      ? "FREE"
                      : formatCurrency(totals.shippingFee)}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  "Placing order..."
                ) : (
                  <>
                    <LockKeyhole size={18} />
                    Place order
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <PackageCheck size={15} />
                Cash on Delivery is available now.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
              <p className="font-semibold text-gray-800">Need help?</p>
              <p className="mt-1">
                Email{" "}
                <a
                  href="mailto:support@shopease.com"
                  className="font-medium text-blue-600 hover:underline"
                >
                  support@shopease.com
                </a>{" "}
                and we will help with your order.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
