
import { NextResponse } from "next/server";
import pool from "@/lib/db/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS username,
        NOW() AS current_time
    `);

    return NextResponse.json({
      success: true,
      message: "PostgreSQL connected successfully!",
      database: result.rows[0].database,
      username: result.rows[0].username,
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("PostgreSQL connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "PostgreSQL connection failed",
      },
      { status: 500 }
    );
  }
}