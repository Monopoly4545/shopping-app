import { pool } from "@/lib/db/db";
import { ensureUserDataSchema } from "@/lib/user/schema";
import type { Product } from "@/types/shop";
import type { CartItem, FavoriteProduct } from "@/types/user-data";

export interface GuestCartItem {
  productId: number;
  quantity: number;
}

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: string;
  original_price: string;
  rating: string;
  reviews: number;
  image: string;
  is_new: boolean;
  is_sale: boolean;
}

const PRODUCT_COLUMNS = `
  p.id,
  p.name,
  c.name AS category,
  p.price,
  p.original_price,
  p.rating,
  p.reviews,
  p.image,
  p.is_new,
  p.is_sale
`;

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: toNumber(row.price),
    originalPrice: toNumber(row.original_price),
    rating: toNumber(row.rating),
    reviews: row.reviews,
    image: row.image,
    isNew: row.is_new,
    isSale: row.is_sale,
  };
}

export async function getCartItems(userId: string): Promise<CartItem[]> {
  await ensureUserDataSchema();

  const result = await pool.query<ProductRow & { quantity: number }>(
    `SELECT ${PRODUCT_COLUMNS}, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN categories c ON c.id = p.category_id
     WHERE ci.user_id = $1
     ORDER BY ci.created_at ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    product: mapProduct(row),
    quantity: row.quantity,
  }));
}

export async function addCartItem(
  userId: string,
  productId: number,
  quantity = 1
): Promise<void> {
  await ensureUserDataSchema();

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET
       quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity),
       updated_at = now()`,
    [userId, productId, quantity]
  );
}

export async function setCartItemQuantity(
  userId: string,
  productId: number,
  quantity: number
): Promise<void> {
  await ensureUserDataSchema();

  if (quantity < 1) {
    await removeCartItem(userId, productId);
    return;
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET
       quantity = EXCLUDED.quantity,
       updated_at = now()`,
    [userId, productId, Math.min(99, quantity)]
  );
}

export async function removeCartItem(
  userId: string,
  productId: number
): Promise<void> {
  await ensureUserDataSchema();

  await pool.query(
    "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
    [userId, productId]
  );
}

/**
 * Adds the items a guest collected before signing in. Products that no longer
 * exist are skipped and duplicate products are combined.
 */
export async function mergeCartItems(
  userId: string,
  items: GuestCartItem[]
): Promise<void> {
  await ensureUserDataSchema();

  const totals = new Map<number, number>();

  for (const item of items) {
    totals.set(
      item.productId,
      (totals.get(item.productId) ?? 0) + item.quantity
    );
  }

  for (const [productId, quantity] of totals) {
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       SELECT $1, $2, $3
       WHERE EXISTS (SELECT 1 FROM products WHERE id = $2)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET
         quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity),
         updated_at = now()`,
      [userId, productId, Math.min(99, quantity)]
    );
  }
}

export async function getFavorites(
  userId: string
): Promise<FavoriteProduct[]> {
  await ensureUserDataSchema();

  const result = await pool.query<{
    id: number;
    name: string;
    price: string;
    image: string;
    category: string;
    rating: string;
  }>(
    `SELECT
       p.id,
       p.name,
       p.price,
       p.image,
       c.name AS category,
       p.rating
     FROM favorites f
     JOIN products p ON p.id = f.product_id
     JOIN categories c ON c.id = p.category_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: toNumber(row.price),
    image: row.image,
    category: row.category,
    rating: toNumber(row.rating),
  }));
}

export async function addFavorite(
  userId: string,
  productId: number
): Promise<void> {
  await ensureUserDataSchema();

  await pool.query(
    `INSERT INTO favorites (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
}

export async function removeFavorite(
  userId: string,
  productId: number
): Promise<void> {
  await ensureUserDataSchema();

  await pool.query(
    "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
    [userId, productId]
  );
}

/**
 * Adds the favorites a guest saved before signing in. Unknown products are
 * skipped so a stale browser entry cannot block the login.
 */
export async function mergeFavorites(
  userId: string,
  productIds: number[]
): Promise<void> {
  await ensureUserDataSchema();

  for (const productId of new Set(productIds)) {
    await pool.query(
      `INSERT INTO favorites (user_id, product_id)
       SELECT $1, $2
       WHERE EXISTS (SELECT 1 FROM products WHERE id = $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    );
  }
}
