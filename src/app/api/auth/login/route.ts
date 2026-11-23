import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { ensureAuthSchema } from "@/lib/auth/schema";
import { startSession } from "@/lib/auth/session";
import pool from "@/lib/db/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 }
      );
    }

    await ensureAuthSchema();

    const result = await pool.query<{
      id: string;
      email: string;
      full_name: string | null;
      password_hash: string | null;
    }>(
      `SELECT id, email, full_name, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.password_hash ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await startSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
