"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/types/shop";
import type { CartItem } from "@/types/user-data";
import { AUTH_CHANGE_EVENT } from "@/lib/auth/client";
import { GUEST_CART_KEY } from "@/lib/user/client-storage";

const MAX_QUANTITY = 99;

type Mode = "loading" | "guest" | "account";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  cartCount: number;
  cartTotal: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function clampQuantity(quantity: number): number {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as {
    product?: { id?: unknown };
    quantity?: unknown;
  };

  return (
    typeof item.product?.id === "number" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
}

function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCartItem).map((item) => ({
      product: item.product,
      quantity: clampQuantity(item.quantity),
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<Mode>("loading");
  const modeRef = useRef<Mode>("loading");

  const applyMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  // Load the signed-in customer's cart, or fall back to guest Local Storage.
  const loadCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });

      if (response.status === 401) {
        setCart(readGuestCart());
        applyMode("guest");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load cart.");
      }

      const data = await response.json();

      setCart(Array.isArray(data.items) ? data.items : []);
      applyMode("account");
    } catch (error) {
      console.error("Cart load error:", error);

      setCart(readGuestCart());
      applyMode("guest");
    }
  }, [applyMode]);

  useEffect(() => {
    // Defer the first load to a microtask so the effect does not set state
    // synchronously during mount.
    void Promise.resolve().then(loadCart);

    function handleAuthChange() {
      // Drop the previous customer's items before loading the new session.
      setCart([]);
      applyMode("loading");
      void loadCart();
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [loadCart, applyMode]);

  // Guests keep their cart in Local Storage. Signed-in carts live in Postgres.
  useEffect(() => {
    if (mode !== "guest") {
      return;
    }

    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save your cart:", error);
    }
  }, [cart, mode]);

  const sendMutation = useCallback(
    async (
      method: "POST" | "PATCH" | "DELETE",
      url: string,
      body?: unknown
    ) => {
      try {
        const response = await fetch(url, {
          method,
          headers:
            body === undefined
              ? undefined
              : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Cart ${method} failed.`);
        }
      } catch (error) {
        console.error("Cart update error:", error);

        // Re-read the server state so the UI cannot drift from the database.
        void loadCart();
      }
    },
    [loadCart]
  );

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find(
          (item) => item.product.id === product.id
        );

        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: clampQuantity(item.quantity + 1) }
              : item
          );
        }

        return [...prev, { product, quantity: 1 }];
      });

      if (modeRef.current === "account") {
        void sendMutation("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });
      }
    },
    [sendMutation]
  );

  const removeFromCart = useCallback(
    (id: number) => {
      setCart((prev) =>
        prev.filter((item) => item.product.id !== id)
      );

      if (modeRef.current === "account") {
        void sendMutation("DELETE", `/api/cart?productId=${id}`);
      }
    },
    [sendMutation]
  );

  const updateQuantity = useCallback(
    (id: number, quantity: number) => {
      if (!Number.isFinite(quantity) || quantity < 1) {
        return;
      }

      const nextQuantity = clampQuantity(quantity);

      setCart((prev) =>
        prev.map((item) =>
          item.product.id === id
            ? { ...item, quantity: nextQuantity }
            : item
        )
      );

      if (modeRef.current === "account") {
        void sendMutation("PATCH", "/api/cart", {
          productId: id,
          quantity: nextQuantity,
        });
      }
    },
    [sendMutation]
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartTotal,
        loading: mode === "loading",
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
