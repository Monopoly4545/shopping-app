import { pool } from "@/lib/db/db";
import { ensureAdminSchema } from "@/lib/admin/schema";
import type { UserRole } from "@/lib/auth/types";
import {
  ORDER_STATUSES,
  isOrderStatus,
  type AdminCategory,
  type AdminCustomer,
  type AdminOrder,
  type AdminProduct,
  type AdminStats,
  type OrderStatus,
  type ProductInput,
  type RevenuePoint,
  type StatusBreakdown,
  type TopProduct,
} from "@/types/admin";

export type {
  AdminCategory,
  AdminCustomer,
  AdminOrder,
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

  const result = await pool.query(
    `UPDATE orders
     SET status = $2, updated_at = now()
     WHERE id = $1`,
    [id, status]
  );

  return (result.rowCount ?? 0) > 0;
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
         SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END),
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
       (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
       (SELECT COUNT(*)::int FROM orders) AS orders,
       (SELECT COUNT(*)::int FROM orders WHERE status IN ('pending', 'processing')) AS active_orders,
       (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS customers,
       (SELECT COUNT(*)::int FROM users WHERE role = 'customer' AND created_at >= now() - interval '30 days') AS new_customers,
       (SELECT COUNT(*)::int FROM products) AS products,
       (SELECT COALESCE(AVG(total), 0) FROM orders WHERE status <> 'cancelled') AS average_order_value`
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
     WHERE o.status <> 'cancelled'
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
