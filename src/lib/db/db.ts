import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.replace(
  /^["']|["']$/g,
  ""
);

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

function shouldUseSsl(value: string | undefined): boolean {
  if (process.env.NODE_ENV !== "production" || !value) {
    return false;
  }

  try {
    const host = new URL(value).hostname;
    return !["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return true;
  }
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
};

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}
