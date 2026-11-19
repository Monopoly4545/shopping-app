
"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/categories";
import { ArrowRight, Grid2X2 } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900">Categories</span>
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Explore Collections
          </p>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Find What You
            <span className="text-blue-600"> Love.</span>
          </h1>

          <p className="mt-6 max-w-xl leading-relaxed text-gray-500">
            Explore our carefully organized collections and discover
            products that fit your lifestyle.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-blue-600">
              <Grid2X2 size={18} />
              <span className="text-sm font-semibold uppercase tracking-widest">
                Browse Categories
              </span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Shop by Category
            </h2>

            <p className="mt-2 text-gray-500">
              Find exactly what you are looking for.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {categories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-200">
                      {category.items}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-5">
                <p className="text-sm text-gray-500">
                  {category.description}
                </p>
                <span className="shrink-0 text-sm font-semibold text-blue-600">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom Banner */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-blue-600 px-8 py-12 text-center text-white md:flex-row md:px-14 md:text-left">
          <div>
            <h2 className="text-3xl font-bold">
              Can't find what you need?
            </h2>
            <p className="mt-2 text-blue-100">
              Browse our complete collection of products.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Explore All Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}