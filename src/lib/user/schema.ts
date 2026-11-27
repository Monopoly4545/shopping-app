import { pool } from "@/lib/db/db";
import { ensureAuthSchema } from "@/lib/auth/schema";

let schemaPromise: Promise<void> | null = null;

/**
 * Creates the per-user shopping tables on first use. Runs once per server
 * process and is safe to call from route handlers and pages.
 */
export function ensureUserDataSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = ensureAuthSchema()
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS cart_items (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1
              CHECK (quantity > 0 AND quantity <= 99),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, product_id)
          );

          CREATE INDEX IF NOT EXISTS cart_items_user_id_idx
          ON cart_items(user_id);

          CREATE TABLE IF NOT EXISTS favorites (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, product_id)
          );

          CREATE INDEX IF NOT EXISTS favorites_user_id_idx
          ON favorites(user_id);
        `)
      )
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }

  return schemaPromise;
}
