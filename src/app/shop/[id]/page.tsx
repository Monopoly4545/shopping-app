"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  ArrowLeft,
  Check,
} from "lucide-react";

import type { Product } from "@/types/shop";
import { getProducts } from "@/lib/db/shop-api";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoriteContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const { addToCart } = useCart();

  const productId = Number(params.id);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setError("Unable to load product");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const product = products.find((item) => item.id === productId);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const { toggleFavorite, isFavorite } = useFavorites();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-gray-500">
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{error}</h1>

        <p className="text-gray-500">Please try again in a moment.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-gray-900">Product Not Found</h1>
        <p className="text-gray-500 mt-3">
          Sorry, this product does not exist.
        </p>
        <Link
          href="/shop"
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const relatedProducts = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4);

  const handleAddToCart = () => {
    // CartContext adds one item per call.
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>

          <span>/</span>

          <Link href="/shop" className="hover:text-blue-600">
            Shop
          </Link>

          <span>/</span>

          <span className="text-gray-900 font-medium truncate">
            {product.name}
          </span>
        </div>
      </div>

      {/* Product Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Image */}
          <div>
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-8">
              {product.isSale && (
                <span className="absolute top-5 left-5 bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  -{discount}% OFF
                </span>
              )}

              {product.isNew && (
                <span className="absolute top-5 left-5 bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  NEW
                </span>
              )}

              <button
                onClick={() =>
                  toggleFavorite({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    rating: product.rating,
                  })
                }
                aria-label="Toggle wishlist"
                className="absolute top-2 right-3 bg-white p-3 rounded-full shadow-sm hover:bg-gray-100"
              >
                <Heart
                  size={22}
                  className={
                    isFavorite(product.id)
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600"
                  }
                />
              </button>

              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="aspect-square rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-center"
                >
                  <img
                    src={product.image}
                    alt={`${product.name} preview`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">
              {product.category}
            </p>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className={
                      index < Math.round(product.rating)
                        ? "fill-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <span className="font-semibold text-gray-700">
                {product.rating}
              </span>

              <span className="text-gray-400">({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mt-7">
              <span className="text-3xl font-bold text-blue-700">
                ${product.price.toFixed(2)}
              </span>

              {product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>

                  <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 my-7" />

            {/* Description */}
            <p className="text-gray-600 leading-7">
              Discover the quality of {product.name}. A great choice from our{" "}
              {product.category}
              collection, carefully selected to give you excellent value and a
              great shopping experience.
            </p>

            {/* Quantity */}
            <div className="mt-8 text-gray-500">
              <label className="text-sm font-semibold text-gray-900">
                Quantity
              </label>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    className="p-3 hover:bg-gray-100 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <span className="text-sm text-gray-500">Maximum 99 items</span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                {added ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => router.push("/cart")}
                className="flex-1 border border-blue-600 text-blue-600 py-4 rounded-xl font-semibold hover:bg-blue-50 transition"
              >
                Buy Now
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-4">
                <Truck className="text-blue-600" size={25} />
                <div>
                  <p className="font-semibold text-gray-900">Fast Delivery</p>
                  <p className="text-sm text-gray-500">
                    Convenient delivery to your doorstep.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ShieldCheck className="text-blue-600" size={25} />
                <div>
                  <p className="font-semibold text-gray-900">Secure Shopping</p>
                  <p className="text-sm text-gray-500">
                    Shop with confidence and security.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <RotateCcw className="text-blue-600" size={25} />
                <div>
                  <p className="font-semibold text-gray-900">Easy Returns</p>
                  <p className="text-sm text-gray-500">
                    Simple return process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description Tabs */}
      <section className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-4 font-semibold ${
                activeTab === "description"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Description
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-semibold ${
                activeTab === "reviews"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Reviews ({product.reviews})
            </button>
          </div>

          <div className="py-8">
            {activeTab === "description" ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  About {product.name}
                </h2>

                <p className="text-gray-600 leading-8 max-w-3xl">
                  {product.name} belongs to our {product.category} collection.
                  Explore this product and discover what makes it a great
                  addition to your shopping list.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Customer Reviews
                </h2>

                <div className="flex items-center gap-3">
                  <Star className="fill-yellow-400 text-yellow-400" size={25} />
                  <span className="text-2xl font-bold">{product.rating}/5</span>
                  <span className="text-gray-500">
                    Based on {product.reviews} reviews
                  </span>
                </div>

                <p className="text-gray-500 mt-4">
                  Individual customer reviews will appear here when your review
                  system is implemented.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Related Products
                </h2>
                <p className="text-gray-500 mt-2">
                  You might also like these products.
                </p>
              </div>

              <Link
                href="/shop"
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedProducts.map((item) => (
                <Link
                  href={`/shop/${item.id}`}
                  key={item.id}
                  className="bg-white rounded-xl p-4 hover:shadow-lg transition group"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition"
                    />
                  </div>

                  <p className="text-xs text-blue-600 mt-4">{item.category}</p>

                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-blue-700 font-bold mt-2">
                    ${item.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Shop */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
