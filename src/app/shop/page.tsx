"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Star,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Check,
} from "lucide-react";

import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { addToCart, cartCount } = useCart();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [addedProduct, setAddedProduct] = useState<number | null>(null);

  // Read category from the URL
  const selectedCategory = searchParams.get("category");

  // Get all available categories
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.category))),
    ],
    []
  );

  // Convert category names into URL-friendly slugs
  const getCategorySlug = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, "-");

  // Find the currently selected category
  const activeCategory =
    categories.find(
      (item) => getCategorySlug(item) === selectedCategory?.toLowerCase()
    ) || "All";

  // Change category and update URL
  const handleCategoryChange = (newCategory: string) => {
    if (newCategory === "All") {
      router.push("/shop");
      return;
    }

    router.push(`/shop?category=${getCategorySlug(newCategory)}`);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search products
    if (search.trim()) {
      const searchTerm = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by URL category
    if (selectedCategory) {
      result = result.filter(
        (product) =>
          getCategorySlug(product.category) ===
          selectedCategory.toLowerCase()
      );
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
    }

    return result;
  }, [search, selectedCategory, sort]);

  // Add product to cart
  const handleAddToCart = (product: (typeof products)[number]) => {
    addToCart(product);
    setAddedProduct(product.id);

    window.setTimeout(() => {
      setAddedProduct((current) =>
        current === product.id ? null : current
      );
    }, 1500);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSort("featured");
    router.push("/shop");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <p className="text-blue-200 font-semibold uppercase tracking-widest text-sm mb-3">
            Discover something amazing
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            Explore Our Shop
          </h1>

          <p className="text-blue-100 max-w-xl text-lg">
            Find your favorite products, discover new arrivals, and enjoy
            shopping with ShopEase.
          </p>

          <div className="mt-8 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} />
              {products.length} Products
            </span>

            <span className="text-blue-300">|</span>
            <span>Quality you can trust</span>
          </div>
        </div>
      </section>

      {/* Shop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeCategory === "All"
                ? "All Products"
                : activeCategory}
            </h2>

            <p className="text-gray-500 mt-1">
              {activeCategory === "All"
                ? "Discover products picked for you."
                : `Explore our ${activeCategory} collection.`}
            </p>
          </div>

          <a
            href="/cart"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-xl text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
          >
            <ShoppingBag size={19} />
            View Cart

            <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          </a>
        </div>

        {/* Search and Sort */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
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
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-800"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none cursor-pointer"
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
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
            <SlidersHorizontal size={18} />
            Categories
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => handleCategoryChange(item)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === item
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Product count */}
        <div className="flex justify-between items-center mb-5">
          <p className="text-gray-500 text-sm">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredProducts.length}
            </span>{" "}
            products
          </p>

          {(search || selectedCategory || sort !== "featured") && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  {product.isNew && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      NEW
                    </span>
                  )}

                  {product.isSale && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      SALE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                    {product.category}
                  </p>

                  <h3 className="font-semibold text-gray-900 text-lg truncate mb-2">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
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
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>

                    {product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
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
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search size={28} className="text-gray-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No products found
            </h3>

            <p className="text-gray-500 mb-6">
              Try searching for something else or choose another category.
            </p>

            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
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
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading shop...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}