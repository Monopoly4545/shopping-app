import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { ensureAuthSchema } from "@/lib/auth/schema";
import { startSession } from "@/lib/auth/session";
import pool from "@/lib/db/db";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const fullName =
      typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!fullName) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    await ensureAuthSchema();

    const passwordHash = await hashPassword(password);

    const result = await pool.query<{
      id: string;
      email: string;
      full_name: string | null;
    }>(
      `INSERT INTO users (id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name`,
      [randomUUID(), email, passwordHash, fullName]
    );

    const user = result.rows[0];

    await startSession(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
