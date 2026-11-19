
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";

import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function HomePage() {
  const { addToCart } = useCart();

  const categories = [
    { name: "Electronics", icon: "🎧" },
    { name: "Fashion", icon: "👕" },
    { name: "Accessories", icon: "⌚" },
    { name: "Home & Living", icon: "🏠" },
  ];

  return (
    <div className="bg-white text-gray-900">

      {/* Hero Section */}
      <section className="bg-blue-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">

          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600">
              Discover Something New
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Shop Smarter.
              <span className="block text-blue-600">
                Live Better.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
              Discover amazing products, unbeatable deals,
              and everything you need in one place.
              Your perfect shopping experience starts here.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold text-white transition hover:bg-blue-700"
              >
                Shop Now
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/categories"
                className="rounded-xl border border-gray-300 bg-white px-7 py-4 font-semibold transition hover:bg-gray-50"
              >
                Explore Categories
              </Link>
            </div>

            <div className="mt-10 flex gap-8">
              <div>
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-sm text-gray-500">Happy Customers</p>
              </div>

              <div>
                <p className="text-2xl font-bold">500+</p>
                <p className="text-sm text-gray-500">Products</p>
              </div>

              <div>
                <p className="text-2xl font-bold">4.9/5</p>
                <p className="text-sm text-gray-500">Customer Rating</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1000"
              alt="Shopping collection"
              width={1000}
              height={800}
              priority
              unoptimized
              className="h-[350px] w-full rounded-3xl object-cover shadow-xl md:h-[480px]"
            />

            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white p-5 shadow-lg md:-left-8">
              <p className="text-sm text-gray-500">Special Offer</p>
              <p className="text-2xl font-bold text-blue-600">
                Up to 40% OFF
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-500">
              Find exactly what you're looking for.
            </p>
          </div>

          <Link
            href="/categories"
            className="hidden items-center gap-2 font-semibold text-blue-600 sm:flex"
          >
            View All <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={`/categories`}
              key={category.name}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="text-4xl">{category.icon}</span>
              <h3 className="mt-4 font-semibold">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-10 flex items-center justify-between">
            <div>
              <span className="font-semibold text-blue-600">
                OUR COLLECTION
              </span>
              <h2 className="mt-2 text-3xl font-bold">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-500">
                Handpicked products just for you.
              </p>
            </div>

            <Link
              href="/shop"
              className="hidden items-center gap-2 font-semibold text-blue-600 sm:flex"
            >
              View All <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={600}
                    height={600}
                    unoptimized
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {product.isSale && (
                    <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      SALE
                    </span>
                  )}

                  {product.isNew && (
                    <span className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      NEW
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-400">
                    {product.category}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1">
                    <Star
                      size={15}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-sm font-medium">
                      {product.rating}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({product.reviews})
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold">
                        ${product.price.toFixed(2)}
                      </span>

                      {product.originalPrice > product.price && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
            <Truck size={28} />
          </div>
          <div>
            <h3 className="font-bold">Free Shipping</h3>
            <p className="text-sm text-gray-500">
              On orders over $100
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 className="font-bold">Secure Payment</h3>
            <p className="text-sm text-gray-500">
              Safe and secure checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
            <Headphones size={28} />
          </div>
          <div>
            <h3 className="font-bold">24/7 Support</h3>
            <p className="text-sm text-gray-500">
              We're always here to help
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}