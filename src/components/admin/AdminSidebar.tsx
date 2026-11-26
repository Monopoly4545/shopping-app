"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";

import type { AuthUser } from "@/lib/auth/types";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate?: () => void;
}) {
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
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ShieldCheck size={21} />
        </span>
        <div>
          <p className="text-base font-bold text-white">ShopEase</p>
          <p className="text-xs text-slate-400">Admin dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Manage
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}

        <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Storefront
        </p>

        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <Store size={19} />
          View store
        </Link>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {(user.fullName || user.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName || user.email.split("@")[0]}
            </p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          <LogOut size={17} />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarContent user={user} />
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl lg:hidden"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 z-10 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <SidebarContent user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
