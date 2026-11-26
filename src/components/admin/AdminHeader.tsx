"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";

import type { AuthUser } from "@/lib/auth/types";

const titles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/products": "Products",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/analytics": "Analytics",
};

function getTitle(pathname: string) {
  if (titles[pathname]) {
    return titles[pathname];
  }

  const match = Object.keys(titles)
    .filter((path) => path !== "/admin")
    .find((path) => pathname.startsWith(path));

  return match ? titles[match] : "Admin";
}

export default function AdminHeader({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear the session locally even if the request fails.
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400">Admin</p>
          <h1 className="truncate text-lg font-bold text-gray-900">
            {getTitle(pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-600 sm:flex"
          >
            <ExternalLink size={16} />
            Storefront
          </Link>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-800">
                {user.fullName || user.email.split("@")[0]}
              </p>
              <p className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
                <ShieldCheck size={12} />
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sign out"
            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
