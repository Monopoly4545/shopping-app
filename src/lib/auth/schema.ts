import pool from "@/lib/db/db";

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
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- The project may already have a users table from an earlier setup.
        -- Add the column instead of failing when the table already exists.
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

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
