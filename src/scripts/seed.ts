
import { pool } from "../lib/db/db";
import { products } from "./seed-data/products";
import { categories } from "./seed-data/categories";

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert categories first
    for (const category of categories) {
      await client.query(
        `INSERT INTO categories
          (id, name, description, image, items, slug)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           image = EXCLUDED.image,
           items = EXCLUDED.items,
           slug = EXCLUDED.slug`,
        [
          category.id,
          category.name,
          category.description,
          category.image,
          category.items,
          category.slug,
        ]
      );
    }

    // Insert products
    for (const product of products) {
      const categoryResult = await client.query(
        "SELECT id FROM categories WHERE name = $1",
        [product.category]
      );

      if (categoryResult.rows.length === 0) {
        throw new Error(`Category not found: ${product.category}`);
      }

      const categoryId = categoryResult.rows[0].id;

      await client.query(
        `INSERT INTO products
          (id, name, category_id, price, original_price,
           rating, reviews, image, is_new, is_sale)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category_id = EXCLUDED.category_id,
           price = EXCLUDED.price,
           original_price = EXCLUDED.original_price,
           rating = EXCLUDED.rating,
           reviews = EXCLUDED.reviews,
           image = EXCLUDED.image,
           is_new = EXCLUDED.is_new,
           is_sale = EXCLUDED.is_sale`,
        [
          product.id,
          product.name,
          categoryId,
          product.price,
          product.originalPrice,
          product.rating,
          product.reviews,
          product.image,
          product.isNew ?? false,
          product.isSale ?? false,
        ]
      );
    }

    await client.query("COMMIT");

    console.log("Database seeded successfully!");
    console.log(`Categories: ${categories.length}`);
    console.log(`Products: ${products.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();