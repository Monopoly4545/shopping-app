
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Star,
} from "lucide-react";
import { useFavorites } from "@/context/FavoriteContext";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <Heart size={20} fill="currentColor" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Your Collection
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              My Favorites
            </h1>

            <p className="text-gray-500 mt-2">
              All the products you love, in one place.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
          >
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Favorite count */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-8 flex items-center justify-between">
          <span className="text-gray-600 font-medium">
            Saved Products
          </span>

          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
            {favorites.length} Items
          </span>
        </div>

        {/* Empty state */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 px-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-6">
              <Heart size={36} className="text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your favorites list is empty
            </h2>

            <p className="text-gray-500 max-w-md mx-auto mb-8">
              You haven't saved any products yet.
              Explore our shop and add products you love!
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-lg font-semibold transition"
            >
              <ShoppingBag size={19} />
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition duration-300"
              >
                {/* Product Image */}
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />

                  <button
                    onClick={() => removeFavorite(product.id)}
                    aria-label={`Remove ${product.name} from favorites`}
                    className="absolute top-3 right-3 bg-white p-2.5 rounded-full shadow hover:bg-red-50 text-red-500 transition"
                  >
                    <Heart size={19} fill="currentColor" />
                  </button>
                </div>

                {/* Product Details */}
                <div className="p-5">
                  {product.category && (
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                      {product.category}
                    </p>
                  )}

                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {product.name}
                  </h3>

                  {product.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-2 text-amber-500">
                      <Star size={15} fill="currentColor" />
                      <span className="text-sm text-gray-600">
                        {product.rating}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-5">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <Link
                    href="/shop"
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
                  >
                    <ShoppingBag size={17} />
                    View in Shop
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}