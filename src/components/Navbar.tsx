"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoriteContext";
import type { AuthUser } from "@/lib/auth/types";
import { AUTH_CHANGE_EVENT, notifyAuthChange } from "@/lib/auth/client";

import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Heart,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Categories", href: "/categories" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();
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

        if (!cancelled) {
          setUser(data.user ?? null);
        }
      } catch (error) {
        console.error("Navbar authentication error:", error);

        if (!cancelled) {
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

    // Listen for successful login, registration or logout.
    window.addEventListener(AUTH_CHANGE_EVENT, refreshUser);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshUser);
    };
  }, []);

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

    // Let any other client components know the session ended.
    notifyAuthChange();

    // Navigate to homepage.
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Shop<span className="text-blue-600">Ease.</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
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
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
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
                  href="/account"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <User size={19} />

                  <span className="max-w-32 truncate">
                    {user.fullName || user.email.split("@")[0] || "Account"}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-5 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-gray-600 hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}

            <div className="flex items-center gap-5 pt-3 border-t">
              {/* Mobile Favorites */}
              <Link
                href="/favorites"
                onClick={() => setIsOpen(false)}
                aria-label="Favorites"
              >
                <Heart size={21} />
              </Link>

              {/* Mobile Cart */}
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                aria-label="Cart"
              >
                <ShoppingCart size={21} />
              </Link>

              {/* Mobile Authentication */}
              {!authLoading &&
                (user ? (
                  <>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 text-blue-600"
                      >
                        <ShieldCheck size={18} />
                        Admin
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-blue-600"
                    >
                      <User size={18} />
                      {user.fullName || "Account"}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-blue-600"
                  >
                    Login
                  </Link>
                ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
