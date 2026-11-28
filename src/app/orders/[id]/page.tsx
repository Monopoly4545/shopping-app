import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Search,
  Truck,
  UserRound,
} from "lucide-react";

import CancelOrderButton from "@/components/orders/CancelOrderButton";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/StatusBadges";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderAccessToken } from "@/lib/orders/access";
import { getCustomerOrder } from "@/lib/orders/queries";
import { isUuid } from "@/lib/orders/validation";
import { getPaymentMethodLabel } from "@/lib/payments/providers";
import type { OrderStatus } from "@/types/orders";

export const dynamic = "force-dynamic";

const progressSteps: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Preparing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotAvailable({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="rounded-full bg-gray-100 p-6 text-gray-400">
        <Package size={52} />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Order not available</h1>
      <p className="mt-3 max-w-md text-gray-500">
        This order may belong to another account, or the guest access link has
        expired. Sign in with the account used at checkout, or look the order up
        with its number and email.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {!signedIn && (
          <Link
            href="/login?next=/orders"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Sign in
          </Link>
        )}

        <Link
          href="/orders/lookup"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
        >
          <Search size={17} />
          Track an order
        </Link>
      </div>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await getCurrentUser();

  if (!isUuid(id)) {
    return <NotAvailable signedIn={Boolean(user)} />;
  }

  const accessToken = await getOrderAccessToken(id);
  const order = await getCustomerOrder(id, {
    userId: user?.id,
    accessToken,
  });

  if (!order) {
    return <NotAvailable signedIn={Boolean(user)} />;
  }

  const activeIndex = progressSteps.findIndex(
    (step) => step.status === order.status
  );
  const canCancel =
    Boolean(user) &&
    (order.status === "pending" || order.status === "confirmed") &&
    order.paymentStatus !== "paid";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={user ? "/orders" : "/shop"}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          {user ? "Back to my orders" : "Continue shopping"}
        </Link>

        {placed === "1" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check size={18} />
            </span>
            <div>
              <p className="font-bold">Thank you! Your order has been placed.</p>
              <p className="mt-1 text-sm text-emerald-700">
                We have recorded your order and will contact you if we need
                anything else. Cash on Delivery is payable when your parcel
                arrives.
              </p>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            <p className="font-semibold">This order is saved to this browser.</p>
            <p className="mt-1">
              To open it later, use your order number and email on the{" "}
              <Link
                href="/orders/lookup"
                className="font-semibold underline"
              >
                order lookup page
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold md:text-4xl">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Clock3 size={15} />
              Placed {formatDate(order.createdAt)}
            </p>
          </div>

          {canCancel && <CancelOrderButton orderId={order.id} />}
        </div>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">Order progress</h2>

          {order.status === "cancelled" ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              This order was cancelled. If you were charged, a refund will be
              returned to your original payment method.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-5 gap-2">
              {progressSteps.map((step, index) => {
                const complete = index <= activeIndex;

                return (
                  <div key={step.status} className="relative text-center">
                    {index > 0 && (
                      <span
                        className={`absolute right-1/2 top-4 h-0.5 w-full ${
                          complete ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                    )}

                    <span
                      className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        complete
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {complete ? <Check size={15} /> : index + 1}
                    </span>

                    <p
                      className={`mt-2 text-xs font-medium sm:text-sm ${
                        complete ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold">
                Items ({order.itemCount})
              </h2>

              <div className="mt-5 divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={72}
                        height={72}
                        unoptimized
                        className="h-[72px] w-[72px] shrink-0 rounded-xl bg-gray-100 object-cover"
                      />
                    ) : (
                      <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                        <Package size={24} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>
                    {order.shippingFee === 0
                      ? "FREE"
                      : formatCurrency(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </section>

            {order.notes && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-bold">Order notes</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {order.notes}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MapPin size={19} className="text-blue-600" />
                Delivery address
              </h2>

              {order.shippingAddress ? (
                <address className="mt-4 space-y-1 text-sm not-italic text-gray-600">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && (
                    <p>{order.shippingAddress.line2}</p>
                  )}
                  <p>
                    {[
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </address>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  No delivery address was saved for this order.
                </p>
              )}

              <div className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <UserRound size={15} className="text-gray-400" />
                  {order.customerName}
                </p>
                <p className="mt-1 break-all">{order.customerEmail}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CircleDollarSign size={19} className="text-blue-600" />
                Payment
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Method</span>
                  <span className="font-semibold">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Status</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {order.payment?.paidAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Paid</span>
                    <span className="font-medium">
                      {formatDate(order.payment.paidAt)}
                    </span>
                  </div>
                )}

                {order.payment?.transactionId && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Transaction</span>
                    <span className="max-w-[10rem] truncate font-mono text-xs">
                      {order.payment.transactionId}
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <CreditCard size={14} className="mt-0.5 shrink-0" />
                Card details are never stored on our servers.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Truck size={19} className="text-blue-600" />
                Delivery tracking
              </h2>

              {order.shipping ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Status</span>
                    <span className="font-semibold capitalize">
                      {order.shipping.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Courier</span>
                    <span className="font-medium">
                      {order.shipping.courier ?? "To be assigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Tracking</span>
                    <span className="font-mono text-xs">
                      {order.shipping.trackingNumber ?? "Not available yet"}
                    </span>
                  </div>

                  {order.shipping.shippedAt && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Shipped</span>
                      <span className="font-medium">
                        {formatDate(order.shipping.shippedAt)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Tracking details will appear here once your order is
                  dispatched.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
