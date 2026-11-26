import { pool } from "@/lib/db/db";
import { ensureAuthSchema } from "@/lib/auth/schema";

let adminSchemaPromise: Promise<void> | null = null;

/**
 * Creates the tables used by the admin dashboard. Runs once per server
 * process and is safe to call from pages, route handlers and scripts.
 */
export function ensureAdminSchema(): Promise<void> {
  if (!adminSchemaPromise) {
    adminSchemaPromise = ensureAuthSchema()
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
            total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
          CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
          CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);

          CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY,
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
          );

          CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
        `)
      )
      .then(() => undefined)
      .catch((error) => {
        adminSchemaPromise = null;
        throw error;
      });
  }

  return adminSchemaPromise;
}
