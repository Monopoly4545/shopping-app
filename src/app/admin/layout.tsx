import type { ReactNode } from "react";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side authorization. The proxy only checks for a session cookie;
  // this is where the role is actually verified against the database.
  const user = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <AdminSidebar user={user} />

        <div className="min-w-0 flex-1">
          <AdminHeader user={user} />
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
