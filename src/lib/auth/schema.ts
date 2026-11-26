import { pool } from "@/lib/db/db";

let schemaPromise: Promise<void> | null = null;

/**
 * Creates the auth tables on first use. The result is cached per server
 * process so we only run the DDL once.
 */
export function ensureAuthSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'customer',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- The project may already have a users table from an earlier setup.
        -- Add the columns instead of failing when the table already exists.
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

        -- Normalise any legacy rows before enforcing the role constraint.
        UPDATE users
        SET role = 'customer'
        WHERE role IS NULL OR role NOT IN ('admin', 'customer');

        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('admin', 'customer'));
          END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
      `)
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }

  return schemaPromise;
}
