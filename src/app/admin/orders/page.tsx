import OrdersManager from "@/components/admin/OrdersManager";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminOrders } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPage("/admin/orders");

  const orders = await listAdminOrders();

  return <OrdersManager initialOrders={orders} />;
}
