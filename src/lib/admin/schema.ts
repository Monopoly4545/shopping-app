import { ensureOrdersSchema } from "@/lib/orders/schema";

/**
 * The admin dashboard and the storefront share the same order tables. This
 * wrapper keeps the existing admin imports working while the order schema
 * lives in one place.
 */
export function ensureAdminSchema(): Promise<void> {
  return ensureOrdersSchema();
}
