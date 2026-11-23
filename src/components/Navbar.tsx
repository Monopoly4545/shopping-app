"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoriteContext";
import type { AuthUser } from "@/lib/auth/types";

import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Heart,
  LogOut,
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

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear the local state even if the request fails.
    }

    setUser(null);
    setIsOpen(false);

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
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <User size={19} />
                  <span className="max-w-32 truncate">
                    {user.fullName || user.email.split("@")[0] || "Account"}
                  </span>
                </Link>

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
              <Link
                href="/favorites"
                onClick={() => setIsOpen(false)}
                aria-label="Favorites"
              >
                <Heart size={21} />
              </Link>

              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                aria-label="Cart"
              >
                <ShoppingCart size={21} />
              </Link>

              {!authLoading &&
                (user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-blue-600"
                    >
                      <User size={18} />
                      Account
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