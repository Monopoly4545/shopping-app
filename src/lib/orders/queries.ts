import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { pool } from "@/lib/db/db";
import type { AuthUser } from "@/lib/auth/types";
import { ensureOrdersSchema } from "@/lib/orders/schema";
import { calculateOrderTotals, roundMoney } from "@/lib/orders/pricing";
import type { CheckoutItemInput } from "@/lib/orders/validation";
import type {
  CustomerOrder,
  CustomerOrderSummary,
  OrderItem,
  OrderPayment,
  OrderShipping,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
  ShippingStatus,
} from "@/types/orders";

export class OrderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

export type CreateOrderInput = {
  user: AuthUser | null;
  guestEmail?: string | null;
  guestItems?: CheckoutItemInput[] | null;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: string;
  shipping_fee: string;
  total: string;
  shipping_address: ShippingAddress | null;
  notes: string | null;
  access_token: string | null;
  created_at: Date;
  updated_at: Date;
};

type OrderItemRow = {
  id: string;
  product_id: number | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

type PaymentRow = {
  id: string;
  provider: PaymentMethod;
  transaction_id: string | null;
  amount: string;
  status: PaymentStatus;
  paid_at: Date | null;
  created_at: Date;
};

type ShippingRow = {
  tracking_number: string | null;
  courier: string | null;
  status: ShippingStatus;
  shipped_at: Date | null;
  delivered_at: Date | null;
};

type CheckoutProductRow = {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createAccessToken(): string {
  return randomBytes(24).toString("hex");
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    unitPrice: toNumber(row.unit_price),
    quantity: row.quantity,
    subtotal: toNumber(row.subtotal),
  };
}

function mapPayment(row: PaymentRow): OrderPayment {
  return {
    id: row.id,
    provider: row.provider,
    transactionId: row.transaction_id,
    amount: toNumber(row.amount),
    status: row.status,
    paidAt: toIso(row.paid_at),
    createdAt: row.created_at.toISOString(),
  };
}

function mapShipping(row: ShippingRow | undefined): OrderShipping | null {
  if (!row) {
    return null;
  }

  return {
    trackingNumber: row.tracking_number,
    courier: row.courier,
    status: row.status,
    shippedAt: toIso(row.shipped_at),
    deliveredAt: toIso(row.delivered_at),
  };
}

/**
 * Validates the cart against database prices, snapshots the products and
 * creates the order, payment and shipping records in one transaction.
 */
export async function createOrder(input: CreateOrderInput): Promise<{
  order: CustomerOrder;
  accessToken: string;
}> {
  await ensureOrdersSchema();

  const customerEmail = input.user?.email ?? input.guestEmail ?? "";
  const customerName = input.shippingAddress.fullName;

  if (!customerEmail) {
    throw new OrderError("An email address is required for checkout.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let products: CheckoutProductRow[];

    if (input.user) {
      const result = await client.query<CheckoutProductRow>(
        `SELECT p.id, p.name, p.price, p.image, ci.quantity
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = $1
         ORDER BY ci.created_at ASC`,
        [input.user.id]
      );

      products = result.rows;
    } else {
      if (!input.guestItems || input.guestItems.length === 0) {
        throw new OrderError("Your cart is empty.");
      }

      const ids = input.guestItems.map((item) => item.productId);
      const result = await client.query<
        Omit<CheckoutProductRow, "quantity">
      >(
        `SELECT id, name, price, image
         FROM products
         WHERE id = ANY($1::int[])`,
        [ids]
      );

      const byId = new Map(result.rows.map((row) => [row.id, row]));

      products = input.guestItems.map((item) => {
        const product = byId.get(item.productId);

        if (!product) {
          throw new OrderError(
            "One of the products in your cart is no longer available."
          );
        }

        return { ...product, quantity: item.quantity };
      });
    }

    if (products.length === 0) {
      throw new OrderError("Your cart is empty.");
    }

    for (const product of products) {
      if (!Number.isInteger(product.quantity) || product.quantity < 1) {
        throw new OrderError("One of your cart items has an invalid quantity.");
      }
    }

    const subtotal = roundMoney(
      products.reduce(
        (sum, product) =>
          sum + toNumber(product.price) * product.quantity,
        0
      )
    );
    const totals = calculateOrderTotals(subtotal);

    const orderId = randomUUID();
    const accessToken = createAccessToken();

    const numberResult = await client.query<{ order_number: string }>(
      `SELECT 'SE-' || lpad(nextval('order_number_seq')::text, 6, '0')
         AS order_number`
    );
    const orderNumber = numberResult.rows[0].order_number;

    await client.query(
      `INSERT INTO orders (
         id, order_number, user_id, customer_name, customer_email,
         customer_phone, status, payment_status, payment_method,
         subtotal, shipping_fee, total, shipping_address, notes, access_token
       )
       VALUES (
         $1, $2, $3, $4, $5,
         $6, 'pending', 'pending', $7,
         $8, $9, $10, $11::jsonb, $12, $13
       )`,
      [
        orderId,
        orderNumber,
        input.user?.id ?? null,
        customerName,
        customerEmail,
        input.shippingAddress.phone,
        input.paymentMethod,
        totals.subtotal,
        totals.shippingFee,
        totals.total,
        JSON.stringify(input.shippingAddress),
        input.notes,
        accessToken,
      ]
    );

    for (const product of products) {
      const unitPrice = toNumber(product.price);

      await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, product_name, product_image,
           quantity, unit_price, subtotal
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          randomUUID(),
          orderId,
          product.id,
          product.name,
          product.image,
          product.quantity,
          unitPrice,
          roundMoney(unitPrice * product.quantity),
        ]
      );
    }

    await client.query(
      `INSERT INTO payments (id, order_id, provider, amount, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [randomUUID(), orderId, input.paymentMethod, totals.total]
    );

    await client.query(
      `INSERT INTO shipping (id, order_id, status)
       VALUES ($1, $2, 'pending')`,
      [randomUUID(), orderId]
    );

    if (input.user) {
      await client.query("DELETE FROM cart_items WHERE user_id = $1", [
        input.user.id,
      ]);
    }

    await client.query("COMMIT");

    const order = await getCustomerOrder(orderId, {
      userId: input.user?.id,
      accessToken,
    });

    if (!order) {
      throw new OrderError("The order could not be loaded after checkout.", 500);
    }

    return { order, accessToken };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listCustomerOrders(
  userId: string
): Promise<CustomerOrderSummary[]> {
  await ensureOrdersSchema();

  const result = await pool.query<{
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    total: string;
    item_count: number;
    created_at: Date;
  }>(
    `SELECT
       o.id,
       o.order_number,
       o.status,
       o.payment_status,
       o.payment_method,
       o.total,
       COUNT(oi.id)::int AS item_count,
       o.created_at
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    total: toNumber(row.total),
    itemCount: row.item_count,
    createdAt: row.created_at.toISOString(),
  }));
}

/**
 * Loads an order only when the caller owns it (signed-in customer) or holds
 * the secret access token issued to a guest checkout.
 */
export async function getCustomerOrder(
  orderId: string,
  access: { userId?: string | null; accessToken?: string | null }
): Promise<CustomerOrder | null> {
  await ensureOrdersSchema();

  const orderResult = await pool.query<OrderRow>(
    `SELECT
       id, order_number, user_id, customer_name, customer_email,
       customer_phone, status, payment_status, payment_method,
       subtotal, shipping_fee, total, shipping_address, notes,
       access_token, created_at, updated_at
     FROM orders
     WHERE id = $1`,
    [orderId]
  );

  const order = orderResult.rows[0];

  if (!order) {
    return null;
  }

  const ownsOrder = Boolean(access.userId && order.user_id === access.userId);
  const hasToken = Boolean(
    access.accessToken &&
      order.access_token &&
      safeEqual(access.accessToken, order.access_token)
  );

  if (!ownsOrder && !hasToken) {
    return null;
  }

  const [itemsResult, paymentResult, shippingResult] = await Promise.all([
    pool.query<OrderItemRow>(
      `SELECT
         id, product_id, product_name, product_image,
         quantity, unit_price, subtotal
       FROM order_items
       WHERE order_id = $1
       ORDER BY product_name ASC`,
      [orderId]
    ),
    pool.query<PaymentRow>(
      `SELECT
         id, provider, transaction_id, amount, status, paid_at, created_at
       FROM payments
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    ),
    pool.query<ShippingRow>(
      `SELECT
         tracking_number, courier, status, shipped_at, delivered_at
       FROM shipping
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    ),
  ]);

  const items = itemsResult.rows.map(mapOrderItem);

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    total: toNumber(order.total),
    itemCount: items.length,
    createdAt: order.created_at.toISOString(),
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shipping_fee),
    shippingAddress: order.shipping_address,
    notes: order.notes,
    items,
    payment: paymentResult.rows[0] ? mapPayment(paymentResult.rows[0]) : null,
    shipping: mapShipping(shippingResult.rows[0]),
  };
}

/**
 * Guest order lookup. Both pieces of information must match before a new
 * access cookie is issued, so an order number alone is not enough.
 */
export async function findOrderForLookup(
  orderNumber: string,
  email: string
): Promise<{ id: string; accessToken: string } | null> {
  await ensureOrdersSchema();

  const result = await pool.query<{
    id: string;
    access_token: string | null;
  }>(
    `SELECT id, access_token
     FROM orders
     WHERE lower(order_number) = lower($1)
       AND lower(customer_email) = lower($2)
     LIMIT 1`,
    [orderNumber, email]
  );

  const row = result.rows[0];

  if (!row?.access_token) {
    return null;
  }

  return { id: row.id, accessToken: row.access_token };
}

export async function cancelCustomerOrder(
  orderId: string,
  userId: string
): Promise<boolean> {
  await ensureOrdersSchema();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: string }>(
      `UPDATE orders
       SET status = 'cancelled',
           payment_status = CASE
             WHEN payment_status = 'pending' THEN 'failed'
             ELSE payment_status
           END,
           updated_at = now()
       WHERE id = $1
         AND user_id = $2
         AND status IN ('pending', 'confirmed')
         AND payment_status <> 'paid'
       RETURNING id`,
      [orderId, userId]
    );

    if ((result.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `UPDATE payments
       SET status = 'failed', updated_at = now()
       WHERE order_id = $1 AND status = 'pending'`,
      [orderId]
    );

    await client.query(
      `UPDATE shipping
       SET status = 'cancelled', updated_at = now()
       WHERE order_id = $1`,
      [orderId]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
