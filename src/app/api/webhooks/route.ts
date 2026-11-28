import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { pool } from "@/lib/db/db";
import { ensureOrdersSchema } from "@/lib/orders/schema";
import {
  isPaymentMethod,
  isPaymentStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@/types/orders";

export const runtime = "nodejs";

type WebhookOrderRow = {
  id: string;
  total: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
};

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = signature.replace(/^sha256=/i, "").trim().toLowerCase();

  return safeEqual(expected, provided);
}

/**
 * Generic, signed payment-provider webhook.
 *
 * Providers (or a small adapter) should POST:
 *   {
 *     "provider": "stripe",
 *     "transactionId": "pi_...",
 *     "orderNumber": "SE-100001",
 *     "amount": 42.5,
 *     "status": "paid"
 *   }
 *
 * with an `x-payment-signature` header containing the hex HMAC-SHA256 of the
 * raw request body using PAYMENT_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  if (!process.env.PAYMENT_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Payment webhooks are not configured." },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature") ?? "";

  if (!signature || !verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;

  try {
    const parsed: unknown = JSON.parse(rawBody);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Payload must be an object.");
    }

    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    );
  }

  const provider =
    typeof payload.provider === "string"
      ? payload.provider.trim().toLowerCase()
      : "";
  const transactionId =
    typeof payload.transactionId === "string"
      ? payload.transactionId.trim()
      : "";
  const orderNumber =
    typeof payload.orderNumber === "string"
      ? payload.orderNumber.trim()
      : "";
  const amount = Number(payload.amount);
  const status =
    typeof payload.status === "string" ? payload.status.trim() : "";

  if (
    !isPaymentMethod(provider) ||
    !transactionId ||
    transactionId.length > 200 ||
    !orderNumber ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !isPaymentStatus(status)
  ) {
    return NextResponse.json(
      { error: "Webhook payload is missing required fields." },
      { status: 400 }
    );
  }

  await ensureOrdersSchema();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query<WebhookOrderRow>(
      `SELECT id, total, status, payment_status, payment_method
       FROM orders
       WHERE order_number = $1
       FOR UPDATE`,
      [orderNumber]
    );

    const order = orderResult.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (Math.abs(Number(order.total) - amount) > 0.01) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Webhook amount does not match the order total." },
        { status: 400 }
      );
    }

    // Late or out-of-order failures must not downgrade a completed payment.
    if (
      order.payment_status === "paid" &&
      (status === "pending" || status === "failed")
    ) {
      await client.query("COMMIT");
      return NextResponse.json({ received: true, ignored: true });
    }

    const existingPayment = await client.query<{ id: string }>(
      `SELECT id
       FROM payments
       WHERE provider = $1 AND transaction_id = $2
       FOR UPDATE`,
      [provider, transactionId]
    );

    if (existingPayment.rows[0]) {
      await client.query(
        `UPDATE payments
         SET amount = $2,
             status = $3,
             paid_at = CASE
               WHEN $3 = 'paid' THEN COALESCE(paid_at, now())
               ELSE paid_at
             END,
             raw_payload = $4::jsonb,
             updated_at = now()
         WHERE id = $1`,
        [
          existingPayment.rows[0].id,
          amount,
          status,
          JSON.stringify(payload),
        ]
      );
    } else {
      await client.query(
        `INSERT INTO payments (
           id, order_id, provider, transaction_id, amount, status,
           paid_at, raw_payload
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           CASE WHEN $6 = 'paid' THEN now() ELSE NULL END,
           $7::jsonb
         )`,
        [
          randomUUID(),
          order.id,
          provider,
          transactionId,
          amount,
          status,
          JSON.stringify(payload),
        ]
      );
    }

    const nextOrderStatus: OrderStatus =
      status === "paid" && order.status === "pending"
        ? "confirmed"
        : order.status;

    await client.query(
      `UPDATE orders
       SET payment_status = $2,
           payment_method = $3,
           status = $4,
           updated_at = now()
       WHERE id = $1`,
      [order.id, status, provider, nextOrderStatus]
    );

    await client.query("COMMIT");

    return NextResponse.json({ received: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Payment webhook error:", error);

    return NextResponse.json(
      { error: "Failed to process webhook." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
