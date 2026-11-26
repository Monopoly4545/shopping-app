import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { pool } from "@/lib/db/db";
import { ensureAuthSchema } from "@/lib/auth/schema";
import type { AuthUser, UserRole } from "@/lib/auth/types";

export const SESSION_COOKIE = "session";

const SESSION_DAYS = 7;

export type { AuthUser };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normaliseRole(role: string | null): UserRole {
  return role === "admin" ? "admin" : "customer";
}

/**
 * Creates a session row and stores the raw token in an httpOnly cookie.
 */
export async function startSession(userId: string): Promise<void> {
  await ensureAuthSchema();

  const token = randomBytes(32).toString("hex");

  await pool.query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' days')::interval)`,
    [randomUUID(), userId, hashToken(token), SESSION_DAYS]
  );

  // Keep the sessions table from growing forever.
  await pool.query("DELETE FROM sessions WHERE expires_at < now()");

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/**
 * Reads the session cookie, verifies it against the database and returns the
 * signed-in user (or null).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  await ensureAuthSchema();

  const result = await pool.query<{
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
  }>(
    `SELECT u.id, u.email, u.full_name, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()
     LIMIT 1`,
    [hashToken(token)]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: normaliseRole(row.role),
  };
}

/**
 * Deletes the current session row and clears the cookie.
 */
export async function endSession(): Promise<void> {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await pool.query("DELETE FROM sessions WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }

  cookieStore.delete(SESSION_COOKIE);
}
