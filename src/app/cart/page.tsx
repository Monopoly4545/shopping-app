
"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import {
  FREE_SHIPPING_THRESHOLD,
  calculateOrderTotals,
} from "@/lib/orders/pricing";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const totals = calculateOrderTotals(cartTotal);

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">

        <div className="rounded-full bg-blue-50 p-8 text-blue-600">
          <ShoppingBag size={64} />
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          Your Cart is Empty
        </h1>

        <p className="mt-3 max-w-md text-gray-500">
          Looks like you have not added anything to your
          cart yet. Discover our amazing products and
          find something you will love.
        </p>

        <Link
          href="/shop"
          className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
        >
          <ShoppingCart size={20} />
          Start Shopping
          <ArrowRight size={18} />
        </Link>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/shop"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>

          <h1 className="text-3xl font-bold md:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-gray-500">
            You have {cart.length} different products in your cart.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Cart Items */}
          <div className="space-y-5 lg:col-span-2">

            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 sm:flex-row sm:items-center"
              >

                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  width={150}
                  height={150}
                  unoptimized
                  className="h-32 w-full rounded-xl bg-gray-100 object-cover sm:w-32"
                />

                <div className="flex-1">
                  <p className="text-sm text-gray-400">
                    {item.product.category}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {item.product.name}
                  </h3>

                  <p className="mt-2 font-bold text-blue-600">
                    ${item.product.price.toFixed(2)}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-gray-500">

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="rounded-lg border p-2 transition hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="min-w-6 text-center font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1
                        )
                      }
                      className="rounded-lg border p-2 transition hover:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>

                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-between sm:self-stretch">

                  <p className="font-bold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>

                  <button
                    onClick={() =>
                      removeFromCart(item.product.id)
                    }
                    className="flex items-center gap-2 text-sm text-red-500 transition hover:text-red-700"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>

                </div>

              </div>
            ))}

          </div>

          {/* Order Summary */}
          <div className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>
                  {totals.shippingFee === 0
                    ? "FREE"
                    : `$${totals.shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {cartTotal < FREE_SHIPPING_THRESHOLD && (
              <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-600">
                Add $
                {(FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(2)}{" "}
                more to qualify for free shipping!
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700"
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/orders/lookup"
              className="mt-4 block text-center text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              Track a guest order
            </Link>

            <Link
              href="/shop"
              className="mt-4 block text-center text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              Continue Shopping
            </Link>

          </div>

        </div>
      </div>
    </div>
  );
}