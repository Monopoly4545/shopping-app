import { pool } from "@/lib/db/db";
import { ensureAuthSchema } from "@/lib/auth/schema";

let ordersSchemaPromise: Promise<void> | null = null;

/**
 * Creates (or upgrades) the order, payment and shipping tables.
 *
 * The admin dashboard originally owned the `orders` table, so this schema is
 * deliberately additive: existing installations keep their data while new
 * payment/shipping columns are filled in with safe defaults.
 */
export function ensureOrdersSchema(): Promise<void> {
  if (!ordersSchemaPromise) {
    ordersSchemaPromise = ensureAuthSchema()
      .then(() =>
        pool.query(`
          SELECT pg_advisory_xact_lock(hashtext('shopease_orders_schema'));

          CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 100001;

          CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            payment_status TEXT NOT NULL DEFAULT 'pending',
            payment_method TEXT NOT NULL DEFAULT 'cod',
            subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
            shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
            total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
            shipping_address JSONB,
            notes TEXT,
            access_token TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT;

          -- Legacy orders only stored a total. Treat it as the subtotal so the
          -- order detail page can still show a complete breakdown.
          UPDATE orders
          SET subtotal = total
          WHERE subtotal = 0 AND total > 0;

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'orders_status_check'
                AND pg_get_constraintdef(oid) LIKE '%confirmed%'
            ) THEN
              ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
              ALTER TABLE orders
              ADD CONSTRAINT orders_status_check
              CHECK (status IN (
                'pending', 'confirmed', 'processing', 'shipped',
                'delivered', 'cancelled'
              ));
            END IF;
          END $$;

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'orders_payment_status_check'
            ) THEN
              ALTER TABLE orders
              ADD CONSTRAINT orders_payment_status_check
              CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
            END IF;
          END $$;

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'orders_payment_method_check'
            ) THEN
              ALTER TABLE orders
              ADD CONSTRAINT orders_payment_method_check
              CHECK (payment_method IN ('cod', 'stripe', 'paypal', 'kbzpay'));
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
          CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
          CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
          CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
          CREATE UNIQUE INDEX IF NOT EXISTS orders_access_token_idx
            ON orders(access_token)
            WHERE access_token IS NOT NULL;

          CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY,
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
            product_name TEXT NOT NULL,
            product_image TEXT,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
            subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0)
          );

          ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
          ALTER TABLE order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0;

          UPDATE order_items
          SET subtotal = unit_price * quantity
          WHERE subtotal = 0 AND unit_price > 0 AND quantity > 0;

          CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

          CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY,
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            transaction_id TEXT,
            amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
            status TEXT NOT NULL DEFAULT 'pending',
            raw_payload JSONB,
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'payments_status_check'
            ) THEN
              ALTER TABLE payments
              ADD CONSTRAINT payments_status_check
              CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id);
          CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_transaction_idx
            ON payments(provider, transaction_id)
            WHERE transaction_id IS NOT NULL;

          CREATE TABLE IF NOT EXISTS shipping (
            id UUID PRIMARY KEY,
            order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
            tracking_number TEXT,
            courier TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            shipped_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'shipping_status_check'
            ) THEN
              ALTER TABLE shipping
              ADD CONSTRAINT shipping_status_check
              CHECK (status IN (
                'pending', 'preparing', 'shipped', 'delivered', 'cancelled'
              ));
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS shipping_order_id_idx ON shipping(order_id);
        `)
      )
      .then(() => undefined)
      .catch((error) => {
        ordersSchemaPromise = null;
        throw error;
      });
  }

  return ordersSchemaPromise;
}
