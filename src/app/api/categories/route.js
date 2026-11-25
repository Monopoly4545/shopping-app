import { NextResponse } from "next/server";
import { query } from "@/lib/db/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        description,
        image,
        items,
        slug
      FROM categories
      ORDER BY id ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Categories API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}