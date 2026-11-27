import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Heart,
  Mail,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import AccountLogoutButton from "@/components/account/AccountLogoutButton";
import { ensureAuthSchema } from "@/lib/auth/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { pool } from "@/lib/db/db";
import { ensureUserDataSchema } from "@/lib/user/schema";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  await ensureAuthSchema();
  await ensureUserDataSchema();

  const result = await pool.query<{
    created_at: Date;
    cart_count: number;
    favorite_count: number;
  }>(
    `SELECT
       u.created_at,
       (SELECT COALESCE(SUM(quantity), 0)::int
        FROM cart_items WHERE user_id = u.id) AS cart_count,
       (SELECT COUNT(*)::int
        FROM favorites WHERE user_id = u.id) AS favorite_count
     FROM users u
     WHERE u.id = $1`,
    [user.id]
  );

  const row = result.rows[0];

  const memberSince = row?.created_at
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(row.created_at)
    : null;

  const displayName = user.fullName || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            My Account
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-gray-500">
            Your cart, favorites and profile details are saved to your
            account.
          </p>
        </div>

        {/* Profile card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {user.fullName || "ShopEase customer"}
                </h2>

                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail size={15} />
                  {user.email}
                </p>

                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <UserRound size={13} />
                  {user.role}
                </span>
              </div>
            </div>

            <AccountLogoutButton />
          </div>

          <div className="mt-8 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-blue-600" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Member since
                </p>
                <p className="font-semibold">
                  {memberSince ?? "Just now"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShoppingBag className="text-blue-600" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Items in cart
                </p>
                <p className="font-semibold">
                  {row?.cart_count ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Heart className="text-red-500" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Saved favorites
                </p>
                <p className="font-semibold">
                  {row?.favorite_count ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/cart"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
          >
            <ShoppingBag className="mb-4 text-blue-600" size={26} />
            <h3 className="font-bold">Shopping cart</h3>
            <p className="mt-1 text-sm text-gray-500">
              Review the products you have saved for later.
            </p>
          </Link>

          <Link
            href="/favorites"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-red-300 hover:shadow-md"
          >
            <Heart className="mb-4 text-red-500" size={26} />
            <h3 className="font-bold">Favorites</h3>
            <p className="mt-1 text-sm text-gray-500">
              See everything you have hearted.
            </p>
          </Link>

          <Link
            href="/shop"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
          >
            <ShoppingBag className="mb-4 text-blue-600" size={26} />
            <h3 className="font-bold">Continue shopping</h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse the latest products in the shop.
            </p>
          </Link>
        </section>

        {user.role === "admin" && (
          <section className="mt-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <ShieldCheck size={19} />
              Open admin dashboard
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
