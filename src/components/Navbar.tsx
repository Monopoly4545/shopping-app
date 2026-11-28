"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoriteContext";
import type { AuthUser } from "@/lib/auth/types";
import {
  AUTH_CHANGE_EVENT,
  getCachedAuthUser,
  setAuthUser,
} from "@/lib/auth/client";

import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Heart,
  LogOut,
  Package,
  ShieldCheck,
  Home,
  Store,
  LayoutGrid,
  Info,
  Mail,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/shop", icon: Store },
  { name: "Categories", href: "/categories", icon: LayoutGrid },
  { name: "About", href: "/about", icon: Info },
  { name: "Contact", href: "/contact", icon: Mail },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(
    () => getCachedAuthUser() ?? null
  );
  const [authLoading, setAuthLoading] = useState(
    () => getCachedAuthUser() === undefined
  );

  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { favorites } = useFavorites();

  // Fetch the currently authenticated user.
  useEffect(() => {
    let cancelled = false;

    async function refreshUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch authenticated user.");
        }

        const data = await response.json();

        // A login/logout may have finished while this request was in flight.
        // In that case the explicit result is newer than /api/auth/me.
        if (!cancelled && getCachedAuthUser() === undefined) {
          setUser(data.user ?? null);
        }
      } catch (error) {
        console.error("Navbar authentication error:", error);

        if (!cancelled && getCachedAuthUser() === undefined) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    // Check authentication when Navbar mounts.
    refreshUser();

    // Login, registration and logout publish the new user synchronously.
    function handleAuthChange() {
      const cached = getCachedAuthUser();

      if (cached !== undefined) {
        setUser(cached);
        setAuthLoading(false);
        return;
      }

      void refreshUser();
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  // Close the mobile menu when the browser's back/forward buttons are used.
  useEffect(() => {
    function handlePopState() {
      setIsOpen(false);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Close on Escape and when the window grows to desktop width.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    const desktop = window.matchMedia(DESKTOP_QUERY);

    function handleDesktopChange() {
      if (desktop.matches) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleDesktopChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleDesktopChange);
    };
  }, [isOpen]);

  // Keep the page behind the open mobile menu from scrolling.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Logout customer.
  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear Navbar authentication state.
    setUser(null);
    setIsOpen(false);

    // Let the cart, favorites and any other client components know
    // the session ended.
    setAuthUser(null);

    // Navigate to homepage.
    router.replace("/");
    router.refresh();
  }

  function closeMobileMenu() {
    setIsOpen(false);
  }

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const accountName =
    user?.fullName?.trim() || user?.email.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Shop<span className="text-blue-600">Ease.</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`transition ${
                  isActive(link.href)
                    ? "font-semibold text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 lg:flex xl:gap-5">
            <button
              aria-label="Search"
              className="text-gray-700 hover:text-blue-600"
            >
              <Search size={21} />
            </button>

            {/* Favorites */}
            <Link
              href="/favorites"
              aria-label="My favorites"
              className="relative text-gray-700 hover:text-red-500"
            >
              <Heart size={21} />

              {favorites.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart */}
            <Link
              href="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative text-gray-700 hover:text-blue-600"
            >
              <ShoppingCart size={22} />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Authentication */}
            {authLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Admin Link */}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <ShieldCheck size={17} />
                    Admin
                  </Link>
                )}

                {/* Account Link */}
                <Link
                  href="/orders"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <Package size={19} />
                  <span>Orders</span>
                </Link>

                <Link
                  href="/account"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <User size={19} />

                  <span className="max-w-32 truncate">{accountName}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 transition hover:bg-gray-200"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              href="/favorites"
              aria-label="Favorites"
              className="relative rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 hover:text-red-500"
            >
              <Heart size={22} />

              {favorites.length > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {favorites.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
            >
              <ShoppingCart size={22} />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen((open) => !open)}
              className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-gray-900/30 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gray-100 bg-white shadow-xl lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6">
            {/* Account summary / sign in */}
            {authLoading ? (
              <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ) : user ? (
              <Link
                href="/account"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                  {accountName.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-900">
                    {accountName}
                  </span>
                  <span className="block truncate text-sm text-gray-500">
                    {user.email}
                  </span>
                </span>

                <ChevronRight size={20} className="shrink-0 text-blue-400" />
              </Link>
            ) : (
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="font-semibold text-gray-900">
                  Welcome to ShopEase
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Sign in to track orders, save favorites, and check out faster.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-blue-700"
                  >
                    Log in
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* Main links */}
            <div className="mt-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    {link.name}
                    <ChevronRight
                      size={18}
                      className="ml-auto text-gray-300"
                    />
                  </Link>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quick actions
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/favorites"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50"
                >
                  <Heart size={19} className="text-red-500" />
                  Favorites

                  {favorites.length > 0 && (
                    <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {favorites.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <ShoppingCart size={19} className="text-blue-600" />
                  Cart

                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>

                {user && (
                  <Link
                    href="/orders"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Package size={19} className="text-blue-600" />
                    Orders
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <ShieldCheck size={19} className="text-blue-600" />
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-200"
              >
                <LogOut size={19} />
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
