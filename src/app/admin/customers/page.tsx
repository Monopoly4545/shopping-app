import CustomersManager from "@/components/admin/CustomersManager";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminCustomers } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await requireAdminPage("/admin/customers");
  const customers = await listAdminCustomers();

  return (
    <CustomersManager
      currentUserId={user.id}
      initialCustomers={customers}
    />
  );
}
