/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type {
  AdminCategory,
  AdminProduct,
  ProductInput,
} from "@/types/admin";

type FormState = {
  name: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  rating: string;
  reviews: string;
  image: string;
  isNew: boolean;
  isSale: boolean;
};

const emptyForm: FormState = {
  name: "",
  categoryId: "",
  price: "",
  originalPrice: "",
  rating: "5",
  reviews: "0",
  image: "",
  isNew: false,
  isSale: false,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function ProductsManager({
  initialProducts,
  initialCategories,
}: {
  initialProducts: AdminProduct[];
  initialCategories: AdminCategory[];
}) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load products.");
      }

      setProducts(data.products ?? []);
      setCategories(data.categories ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function handleRefresh() {
    setLoading(true);
    setError("");
    setSuccess("");
    void load();
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.category}`.toLowerCase().includes(query)
    );
  }, [products, search]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0] ? String(categories[0].id) : "",
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      categoryId: String(product.categoryId),
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      rating: String(product.rating),
      reviews: String(product.reviews),
      image: product.image,
      isNew: product.isNew,
      isSale: product.isSale,
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload: ProductInput = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || form.price),
      rating: Number(form.rating || 0),
      reviews: Number(form.reviews || 0),
      image: form.image.trim(),
      isNew: form.isNew,
      isSale: form.isSale,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save product.");
      }

      setFormOpen(false);
      setSuccess(
        editingId ? "Product updated successfully." : "Product created successfully."
      );
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: AdminProduct) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone. Past order items keep their saved name and price.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete product.");
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSuccess("Product deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create, edit and remove items from your catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60"
            aria-label="Refresh products"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or categories..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <p className="text-sm text-gray-500">
            {filtered.length} of {products.length} products
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-20 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="rounded-full bg-gray-100 p-4 text-gray-400">
              <Package size={30} />
            </span>
            <p className="mt-4 font-semibold text-gray-800">No products found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try a different search or add your first product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 font-semibold">Tags</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          className="h-11 w-11 rounded-lg bg-gray-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="max-w-64 truncate font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">#{product.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">{product.category}</td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                      {product.originalPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(product.originalPrice)}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {product.rating.toFixed(1)} / 5
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.reviews} reviews
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {product.isNew && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            New
                          </span>
                        )}
                        {product.isSale && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Sale
                          </span>
                        )}
                        {!product.isNew && !product.isSale && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => void handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit product" : "Add product"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingId
                    ? `Updating product #${editingId}`
                    : "Create a new item in the storefront catalog"}
                </p>
              </div>

              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              <div>
                <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product name
                </label>
                <input
                  id="product-name"
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Wireless noise-cancelling headphones"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="product-category"
                    required
                    value={form.categoryId}
                    onChange={(event) => updateField("categoryId", event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="product-image" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    id="product-image"
                    required
                    value={form.image}
                    onChange={(event) => updateField("image", event.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Price (USD)
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    placeholder="49.99"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="product-original-price" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Original price (USD)
                  </label>
                  <input
                    id="product-original-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(event) => updateField("originalPrice", event.target.value)}
                    placeholder="Defaults to the price"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-rating" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Rating (0–5)
                  </label>
                  <input
                    id="product-rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(event) => updateField("rating", event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="product-reviews" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Review count
                  </label>
                  <input
                    id="product-reviews"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reviews}
                    onChange={(event) => updateField("reviews", event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 rounded-xl bg-gray-50 px-4 py-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(event) => updateField("isNew", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Mark as new
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isSale}
                    onChange={(event) => updateField("isSale", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Mark as on sale
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
