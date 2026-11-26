import { randomUUID } from "node:crypto";

import { pool } from "../lib/db/db";
import { ensureAuthSchema } from "../lib/auth/schema";
import { ensureAdminSchema } from "../lib/admin/schema";
import { hashPassword } from "../lib/auth/password";
import type { OrderStatus } from "../types/admin";

/**
 * Optional demo data for the admin dashboard. Existing orders are left alone,
 * so it is safe to run more than once.
 */
const demoCustomers = [
  { name: "Alice Morgan", email: "alice.morgan@example.com" },
  { name: "James Lee", email: "james.lee@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "Diego Ramirez", email: "diego.ramirez@example.com" },
  { name: "Emma Wilson", email: "emma.wilson@example.com" },
];

const statuses: OrderStatus[] = [
  "delivered",
  "delivered",
  "delivered",
  "shipped",
  "shipped",
  "processing",
  "processing",
  "pending",
  "pending",
  "cancelled",
  "delivered",
  "shipped",
  "processing",
  "pending",
];

async function main() {
  await ensureAuthSchema();
  await ensureAdminSchema();

  const existing = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM orders"
  );

  if (existing.rows[0].count > 0) {
    console.log(
      `Orders already exist (${existing.rows[0].count}). Skipping demo order seed.`
    );
    return;
  }

  const productsResult = await pool.query<{
    id: number;
    name: string;
    price: string;
  }>("SELECT id, name, price FROM products ORDER BY id ASC LIMIT 12");

  if (productsResult.rows.length === 0) {
    console.error("No products found. Run `npm run seed` first.");
    process.exitCode = 1;
    return;
  }

  const products = productsResult.rows.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
  }));

  const passwordHash = await hashPassword("password123");
  const customerIds: { id: string; name: string; email: string }[] = [];

  for (const customer of demoCustomers) {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'customer')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [randomUUID(), customer.email, passwordHash, customer.name]
    );

    if (inserted.rows[0]) {
      customerIds.push({ id: inserted.rows[0].id, ...customer });
      continue;
    }

    const existingCustomer = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [customer.email]
    );

    if (existingCustomer.rows[0]) {
      customerIds.push({ id: existingCustomer.rows[0].id, ...customer });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let index = 0; index < statuses.length; index += 1) {
      const customer = customerIds[index % customerIds.length];
      const status = statuses[index];
      const orderNumber = `SE-${1001 + index}`;
      const itemCount = (index % 3) + 1;
      const items = Array.from({ length: itemCount }, (_, itemIndex) => {
        const product = products[(index + itemIndex) % products.length];
        return {
          ...product,
          quantity: ((index + itemIndex) % 2) + 1,
        };
      });

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders
           (id, order_number, user_id, customer_name, customer_email,
            status, total, created_at, updated_at)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7, now() - ($8 || ' days')::interval, now())
         ON CONFLICT (order_number) DO NOTHING
         RETURNING id`,
        [
          randomUUID(),
          orderNumber,
          customer.id,
          customer.name,
          customer.email,
          status,
          total,
          index,
        ]
      );

      const orderId = orderResult.rows[0]?.id;

      if (!orderId) {
        continue;
      }

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items
             (id, order_id, product_id, product_name, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            orderId,
            item.id,
            item.name,
            item.quantity,
            item.price,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  console.log(`Seeded ${statuses.length} demo orders.`);
  console.log("Demo customer password: password123");
}

main()
  .catch((error) => {
    console.error("Demo order seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
