import { NextResponse } from "next/server";
import { query } from "@/lib/db/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.name,
        c.name AS category,
        p.price,
        p.original_price AS "originalPrice",
        p.rating,
        p.reviews,
        p.image,
        p.is_new AS "isNew",
        p.is_sale AS "isSale"
      FROM products p
      JOIN categories c
        ON p.category_id = c.id
      ORDER BY p.id ASC
    `);

    const products = result.rows.map((product) => ({
      ...product,
      price: Number(product.price),
      originalPrice: Number(product.originalPrice),
      rating: Number(product.rating),
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}