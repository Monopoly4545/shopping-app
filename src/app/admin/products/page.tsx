import ProductsManager from "@/components/admin/ProductsManager";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  listAdminCategories,
  listAdminProducts,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products");

  const [products, categories] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
  ]);

  return (
    <ProductsManager
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
