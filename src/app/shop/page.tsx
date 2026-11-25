"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Star,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Check,
} from "lucide-react";

import Link from "next/link";
import type { Category, Product } from "@/types/shop";
import { getCategories, getProducts } from "@/lib/db/shop-api";
import { useCart } from "@/context/CartContext";

function ShopContent() {
  const searchParams = useSearchParams();

  const { addToCart, cartCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [addedProduct, setAddedProduct] = useState<number | null>(null);

  // Get initial category from URL
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );

  // Keep category state synchronized with browser Back/Forward
  useEffect(() => {
    const handlePopState = () => {
      setSelectedCategory(
        new URLSearchParams(window.location.search).get("category")
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Load products and categories from the database
  useEffect(() => {
    let active = true;

    Promise.all([getProducts(), getCategories()])
      .then(([productData, categoryData]) => {
        if (!active) return;

        setProducts(productData);
        setCategories(categoryData);
      })
      .catch(() => {
        if (!active) return;

        setError("Unable to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Find selected category
  const activeCategory =
    categories.find((category) => category.slug === selectedCategory) ?? null;

  // Change category without page navigation
  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);

    const url = new URL(window.location.href);

    if (slug) {
      url.searchParams.set("category", slug);
    } else {
      url.searchParams.delete("category");
    }

    // Update URL without refreshing the page
    window.history.pushState(null, "", url);
  };

  // Normalize category names for matching
  const normalizeCategory = (value: string) =>
    value.toLowerCase().trim().replace(/&/g, "and").replace(/\s+/g, "-");

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search products
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by selected category
    if (selectedCategory) {
      const category = categories.find(
        (item) => item.slug === selectedCategory
      );

      if (category) {
        result = result.filter(
          (product) =>
            normalizeCategory(product.category) ===
              normalizeCategory(category.name) ||
            normalizeCategory(product.category) === category.slug
        );
      } else {
        result = [];
      }
    }

    // Sort products
    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;

      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;

      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;

      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      default:
        break;
    }

    return result;
  }, [products, categories, search, selectedCategory, sort]);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProduct(product.id);

    window.setTimeout(() => {
      setAddedProduct((current) =>
        current === product.id ? null : current
      );
    }, 1500);
  };

  // Clear all filters without refreshing
  const clearFilters = () => {
    setSearch("");
    setSort("featured");
    handleCategoryChange(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
        <p className="text-lg font-semibold text-gray-900">{error}</p>

        <p className="text-gray-500">
          Please try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>

            <span>/</span>

            <span className="text-gray-900">Shop</span>
          </div>

          {/* Eyebrow */}
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Discover Something Amazing
          </p>

          {/* Heading */}
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Explore Our
            <span className="text-blue-600"> Shop.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-xl leading-relaxed text-gray-500">
            Find your favorite products, discover new arrivals, and enjoy a
            seamless shopping experience with ShopEase.
          </p>

          {/* Additional Info */}
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-600" />

              <span className="font-semibold text-gray-900">
                {products.length}
              </span>

              Products
            </span>

            <span className="text-gray-300">|</span>

            <span>Quality you can trust</span>
          </div>
        </div>
      </section>

      {/* Shop */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeCategory?.name ?? "All Products"}
            </h2>

            <p className="mt-1 text-gray-500">
              {activeCategory
                ? `Explore our ${activeCategory.name} collection.`
                : "Discover products picked for you."}
            </p>
          </div>

          {/* View Cart */}
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            <ShoppingBag size={19} />

            View Cart

            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {cartCount}
            </span>
          </Link>
        </div>

        {/* Search and Sort */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Search products by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-10 text-gray-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative md:w-56">
              <ArrowUpDown
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 font-semibold text-gray-700">
            <SlidersHorizontal size={18} />
            Categories
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* All Categories */}
            <button
              onClick={() => handleCategoryChange(null)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${
                !selectedCategory
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              All
            </button>

            {/* Category List */}
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => handleCategoryChange(item.slug)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  activeCategory?.slug === item.slug
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Count */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredProducts.length}
            </span>{" "}
            products
          </p>

          {(search || selectedCategory || sort !== "featured") && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Product Image */}
                <Link
                  href={`/shop/${product.id}`}
                  className="relative block aspect-square overflow-hidden bg-gray-100"
                  aria-label={`View ${product.name}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {product.isNew && (
                    <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                      NEW
                    </span>
                  )}

                  {product.isSale && (
                    <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
                      SALE
                    </span>
                  )}
                </Link>

                {/* Product Details */}
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    {product.category}
                  </p>

                  {/* Product Name */}
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="mb-2 truncate text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="mb-4 flex items-center gap-1">
                    <Star
                      size={15}
                      className="fill-yellow-400 text-yellow-400"
                    />

                    <span className="text-sm font-medium text-gray-700">
                      {product.rating}
                    </span>

                    <span className="text-sm text-gray-400">
                      ({product.reviews} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-5 flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>

                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition ${
                      addedProduct === product.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-900 text-white hover:bg-blue-600"
                    }`}
                  >
                    {addedProduct === product.id ? (
                      <>
                        <Check size={18} />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search size={28} className="text-gray-400" />
            </div>

            <h3 className="mb-2 text-xl font-bold text-gray-900">
              No products found
            </h3>

            <p className="mb-6 text-gray-500">
              Try searching for something else or choose another category.
            </p>

            <button
              onClick={clearFilters}
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Show All Products
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-500">
          Loading shop...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}