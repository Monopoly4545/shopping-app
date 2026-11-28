import { randomUUID } from "node:crypto";

import { pool } from "@/lib/db/db";
import { ensureAdminSchema } from "@/lib/admin/schema";
import type { UserRole } from "@/lib/auth/types";
import {
  ORDER_STATUSES,
  isOrderStatus,
  type AdminCategory,
  type AdminCustomer,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminProduct,
  type AdminStats,
  type OrderStatus,
  type ProductInput,
  type RevenuePoint,
  type StatusBreakdown,
  type TopProduct,
} from "@/types/admin";
import type {
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
  ShippingStatus,
} from "@/types/orders";

export type {
  AdminCategory,
  AdminCustomer,
  AdminOrder,
  AdminOrderDetail,
  AdminProduct,
  AdminStats,
  OrderStatus,
  ProductInput,
  RevenuePoint,
  StatusBreakdown,
  TopProduct,
};

export { ORDER_STATUSES, isOrderStatus };

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  await ensureAdminSchema();

  const result = await pool.query<{
    id: number;
    name: string;
    category_id: number;
    category: string;
    price: string;
    original_price: string;
    rating: string;
    reviews: number;
    image: string;
    is_new: boolean;
    is_sale: boolean;
  }>(
    `SELECT
       p.id,
       p.name,
       p.category_id,
       c.name AS category,
       p.price,
       p.original_price,
       p.rating,
       p.reviews,
       p.image,
       p.is_new,
       p.is_sale
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.id ASC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.category,
    price: toNumber(row.price),
    originalPrice: toNumber(row.original_price),
    rating: toNumber(row.rating),
    reviews: row.reviews,
    image: row.image,
    isNew: row.is_new,
    isSale: row.is_sale,
  }));
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const result = await pool.query<{ id: number; name: string }>(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  return result.rows;
}

export async function createAdminProduct(input: ProductInput): Promise<number> {
  await ensureAdminSchema();

  const result = await pool.query<{ id: number }>(
    `INSERT INTO products
       (id, name, category_id, price, original_price, rating, reviews,
        image, is_new, is_sale)
     VALUES
       ((SELECT COALESCE(MAX(id), 0) + 1 FROM products),
        $1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      input.name,
      input.categoryId,
      input.price,
      input.originalPrice,
      input.rating,
      input.reviews,
      input.image,
      input.isNew,
      input.isSale,
    ]
  );

  return result.rows[0].id;
}

export async function updateAdminProduct(
  id: number,
  input: ProductInput
): Promise<boolean> {
  await ensureAdminSchema();

  const result = await pool.query(
    `UPDATE products
     SET name = $2,
         category_id = $3,
         price = $4,
         original_price = $5,
         rating = $6,
         reviews = $7,
         image = $8,
         is_new = $9,
         is_sale = $10
     WHERE id = $1`,
    [
      id,
      input.name,
      input.categoryId,
      input.price,
      input.originalPrice,
      input.rating,
      input.reviews,
      input.image,
      input.isNew,
      input.isSale,
    ]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteAdminProduct(id: number): Promise<boolean> {
  await ensureAdminSchema();

  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

  return (result.rowCount ?? 0) > 0;
}

export async function listAdminOrders(
  status?: OrderStatus,
  limit?: number
): Promise<AdminOrder[]> {
  await ensureAdminSchema();

  const params: unknown[] = [];
  let where = "";

  if (status) {
    params.push(status);
    where = `WHERE o.status = $${params.length}`;
  }

  let limitClause = "";
  if (limit) {
    params.push(limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const result = await pool.query<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
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
       o.customer_name,
       o.customer_email,
       o.status,
       o.payment_status,
       o.payment_method,
       o.total,
       COUNT(oi.id)::int AS item_count,
       o.created_at
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where}
     GROUP BY o.id
     ORDER BY o.created_at DESC
     ${limitClause}`,
    params
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    total: toNumber(row.total),
    itemCount: row.item_count,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus
): Promise<boolean> {
  await ensureAdminSchema();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query<{
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    }>(
      `SELECT payment_method, payment_status
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    const order = current.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      return false;
    }

    // Cash on Delivery is collected when the parcel is delivered.
    const markPaid =
      status === "delivered" &&
      order.payment_method === "cod" &&
      order.payment_status === "pending";

    // A cancelled order with an unpaid attempt should not stay "pending".
    const markFailed =
      status === "cancelled" && order.payment_status === "pending";

    const paymentStatus: PaymentStatus = markPaid
      ? "paid"
      : markFailed
        ? "failed"
        : order.payment_status;

    await client.query(
      `UPDATE orders
       SET status = $2, payment_status = $3, updated_at = now()
       WHERE id = $1`,
      [id, status, paymentStatus]
    );

    if (markPaid) {
      await client.query(
        `UPDATE payments
         SET status = 'paid', paid_at = now(), updated_at = now()
         WHERE order_id = $1 AND status = 'pending'`,
        [id]
      );
    }

    if (markFailed) {
      await client.query(
        `UPDATE payments
         SET status = 'failed', updated_at = now()
         WHERE order_id = $1 AND status = 'pending'`,
        [id]
      );
    }

    const shippingStatus: ShippingStatus =
      status === "processing"
        ? "preparing"
        : status === "shipped"
          ? "shipped"
          : status === "delivered"
            ? "delivered"
            : status === "cancelled"
              ? "cancelled"
              : "pending";

    await client.query(
      `UPDATE shipping
       SET status = $2,
           shipped_at = CASE
             WHEN $2 IN ('shipped', 'delivered') AND shipped_at IS NULL
             THEN now()
             ELSE shipped_at
           END,
           delivered_at = CASE
             WHEN $2 = 'delivered' AND delivered_at IS NULL
             THEN now()
             ELSE delivered_at
           END,
           updated_at = now()
       WHERE order_id = $1`,
      [id, shippingStatus]
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

export async function updateAdminOrderPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<boolean> {
  await ensureAdminSchema();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query<{
      id: string;
      status: OrderStatus;
      payment_method: PaymentMethod;
      total: string;
    }>(
      `SELECT id, status, payment_method, total
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    const order = current.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      return false;
    }

    const nextOrderStatus: OrderStatus =
      paymentStatus === "paid" && order.status === "pending"
        ? "confirmed"
        : order.status;

    await client.query(
      `UPDATE orders
       SET payment_status = $2, status = $3, updated_at = now()
       WHERE id = $1`,
      [id, paymentStatus, nextOrderStatus]
    );

    const updatedPayment = await client.query(
      `UPDATE payments
       SET status = $2,
           paid_at = CASE
             WHEN $2 = 'paid' THEN COALESCE(paid_at, now())
             WHEN $2 = 'refunded' THEN paid_at
             ELSE NULL
           END,
           updated_at = now()
       WHERE id = (
         SELECT id FROM payments
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT 1
       )`,
      [id, paymentStatus]
    );

    if ((updatedPayment.rowCount ?? 0) === 0) {
      await client.query(
        `INSERT INTO payments (id, order_id, provider, amount, status, paid_at)
         VALUES (
           $1, $2, $3, $4, $5,
           CASE WHEN $5 = 'paid' THEN now() ELSE NULL END
         )`,
        [randomUUID(), id, order.payment_method, order.total, paymentStatus]
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function getAdminOrderDetail(
  id: string
): Promise<AdminOrderDetail | null> {
  await ensureAdminSchema();

  const orderResult = await pool.query<{
    id: string;
    order_number: string;
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
    created_at: Date;
  }>(
    `SELECT
       id, order_number, customer_name, customer_email, customer_phone,
       status, payment_status, payment_method, subtotal, shipping_fee,
       total, shipping_address, notes, created_at
     FROM orders
     WHERE id = $1`,
    [id]
  );

  const order = orderResult.rows[0];

  if (!order) {
    return null;
  }

  const [itemsResult, paymentResult, shippingResult] = await Promise.all([
    pool.query<{
      id: string;
      product_id: number | null;
      product_name: string;
      product_image: string | null;
      quantity: number;
      unit_price: string;
      subtotal: string;
    }>(
      `SELECT
         id, product_id, product_name, product_image,
         quantity, unit_price, subtotal
       FROM order_items
       WHERE order_id = $1
       ORDER BY product_name ASC`,
      [id]
    ),
    pool.query<{
      id: string;
      provider: PaymentMethod;
      transaction_id: string | null;
      amount: string;
      status: PaymentStatus;
      paid_at: Date | null;
      created_at: Date;
    }>(
      `SELECT
         id, provider, transaction_id, amount, status, paid_at, created_at
       FROM payments
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    ),
    pool.query<{
      tracking_number: string | null;
      courier: string | null;
      status: ShippingStatus;
      shipped_at: Date | null;
      delivered_at: Date | null;
    }>(
      `SELECT tracking_number, courier, status, shipped_at, delivered_at
       FROM shipping
       WHERE order_id = $1
       LIMIT 1`,
      [id]
    ),
  ]);

  const items = itemsResult.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    quantity: row.quantity,
    unitPrice: toNumber(row.unit_price),
    subtotal: toNumber(row.subtotal),
  }));

  const paymentRow = paymentResult.rows[0];
  const shippingRow = shippingResult.rows[0];

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shipping_fee),
    total: toNumber(order.total),
    itemCount: items.length,
    shippingAddress: order.shipping_address,
    notes: order.notes,
    createdAt: order.created_at.toISOString(),
    items,
    payment: paymentRow
      ? {
          id: paymentRow.id,
          provider: paymentRow.provider,
          transactionId: paymentRow.transaction_id,
          amount: toNumber(paymentRow.amount),
          status: paymentRow.status,
          paidAt: paymentRow.paid_at
            ? paymentRow.paid_at.toISOString()
            : null,
          createdAt: paymentRow.created_at.toISOString(),
        }
      : null,
    shipping: shippingRow
      ? {
          trackingNumber: shippingRow.tracking_number,
          courier: shippingRow.courier,
          status: shippingRow.status,
          shippedAt: shippingRow.shipped_at
            ? shippingRow.shipped_at.toISOString()
            : null,
          deliveredAt: shippingRow.delivered_at
            ? shippingRow.delivered_at.toISOString()
            : null,
        }
      : null,
  };
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  await ensureAdminSchema();

  const result = await pool.query<{
    id: string;
    full_name: string | null;
    email: string;
    role: UserRole;
    order_count: number;
    total_spent: string;
    created_at: Date;
  }>(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.role,
       COUNT(DISTINCT o.id)::int AS order_count,
       COALESCE(
         SUM(
           CASE
             WHEN o.payment_status = 'paid' AND o.status <> 'cancelled'
             THEN o.total
             ELSE 0
           END
         ),
         0
       ) AS total_spent,
       u.created_at
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role === "admin" ? "admin" : "customer",
    orderCount: row.order_count,
    totalSpent: toNumber(row.total_spent),
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getAdminCustomerRole(
  id: string
): Promise<UserRole | null> {
  await ensureAdminSchema();

  const result = await pool.query<{ role: string | null }>(
    "SELECT role FROM users WHERE id = $1",
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return row.role === "admin" ? "admin" : "customer";
}

export async function updateAdminCustomerRole(
  id: string,
  role: UserRole
): Promise<boolean> {
  await ensureAdminSchema();

  const result = await pool.query(
    "UPDATE users SET role = $2 WHERE id = $1",
    [id, role]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function countAdmins(): Promise<number> {
  await ensureAdminSchema();

  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'"
  );

  return result.rows[0].count;
}

export async function getAdminStats(): Promise<AdminStats> {
  await ensureAdminSchema();

  const result = await pool.query<{
    revenue: string;
    orders: number;
    active_orders: number;
    customers: number;
    new_customers: number;
    products: number;
    average_order_value: string;
  }>(
    `SELECT
       (SELECT COALESCE(SUM(total), 0) FROM orders
        WHERE payment_status = 'paid' AND status <> 'cancelled') AS revenue,
       (SELECT COUNT(*)::int FROM orders) AS orders,
       (SELECT COUNT(*)::int FROM orders
        WHERE status IN ('pending', 'confirmed', 'processing')) AS active_orders,
       (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS customers,
       (SELECT COUNT(*)::int FROM users
        WHERE role = 'customer' AND created_at >= now() - interval '30 days') AS new_customers,
       (SELECT COUNT(*)::int FROM products) AS products,
       (SELECT COALESCE(AVG(total), 0) FROM orders
        WHERE payment_status = 'paid' AND status <> 'cancelled') AS average_order_value`
  );

  const row = result.rows[0];

  return {
    revenue: toNumber(row.revenue),
    orders: row.orders,
    activeOrders: row.active_orders,
    customers: row.customers,
    newCustomers: row.new_customers,
    products: row.products,
    averageOrderValue: toNumber(row.average_order_value),
  };
}

export async function getRevenueSeries(days = 14): Promise<RevenuePoint[]> {
  await ensureAdminSchema();

  const result = await pool.query<{
    date: string;
    revenue: string;
    orders: number;
  }>(
    `SELECT
       to_char(d.day, 'YYYY-MM-DD') AS date,
       COALESCE(SUM(o.total), 0) AS revenue,
       COUNT(o.id)::int AS orders
     FROM generate_series(
       current_date - ($1::int - 1),
       current_date,
       interval '1 day'
     ) AS d(day)
     LEFT JOIN orders o
       ON o.created_at::date = d.day
      AND o.payment_status = 'paid'
      AND o.status <> 'cancelled'
     GROUP BY d.day
     ORDER BY d.day ASC`,
    [days]
  );

  return result.rows.map((row) => ({
    date: row.date,
    revenue: toNumber(row.revenue),
    orders: row.orders,
  }));
}

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  await ensureAdminSchema();

  const result = await pool.query<{
    name: string;
    quantity: number;
    revenue: string;
  }>(
    `SELECT
       oi.product_name AS name,
       SUM(oi.quantity)::int AS quantity,
       SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled' AND o.payment_status = 'paid'
     GROUP BY oi.product_name
     ORDER BY revenue DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    name: row.name,
    quantity: row.quantity,
    revenue: toNumber(row.revenue),
  }));
}

export async function getOrderStatusBreakdown(): Promise<StatusBreakdown[]> {
  await ensureAdminSchema();

  const result = await pool.query<{ status: OrderStatus; count: number }>(
    `SELECT status, COUNT(*)::int AS count
     FROM orders
     GROUP BY status`
  );

  const counts = new Map(result.rows.map((row) => [row.status, row.count]));

  return ORDER_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}
