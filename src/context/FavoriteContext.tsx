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

import type { FavoriteProduct } from "@/types/user-data";
import { AUTH_CHANGE_EVENT } from "@/lib/auth/client";
import { GUEST_FAVORITES_KEY } from "@/lib/user/client-storage";

export type { FavoriteProduct };

type Mode = "loading" | "guest" | "account";

type FavoriteContextType = {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (product: FavoriteProduct) => void;
  isFavorite: (id: number) => boolean;
  loading: boolean;
};

const FavoriteContext = createContext<FavoriteContextType | undefined>(
  undefined
);

function isFavoriteProduct(value: unknown): value is FavoriteProduct {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as {
    id?: unknown;
    name?: unknown;
    price?: unknown;
    image?: unknown;
  };

  return (
    typeof item.id === "number" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.image === "string"
  );
}

function readGuestFavorites(): FavoriteProduct[] {
  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isFavoriteProduct);
  } catch {
    return [];
  }
}

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [mode, setMode] = useState<Mode>("loading");
  const modeRef = useRef<Mode>("loading");

  const applyMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  // Load the signed-in customer's favorites, or guest Local Storage.
  const loadFavorites = useCallback(async () => {
    try {
      const response = await fetch("/api/favorites", {
        cache: "no-store",
      });

      if (response.status === 401) {
        setFavorites(readGuestFavorites());
        applyMode("guest");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load favorites.");
      }

      const data = await response.json();

      setFavorites(
        Array.isArray(data.favorites) ? data.favorites : []
      );
      applyMode("account");
    } catch (error) {
      console.error("Favorites load error:", error);

      setFavorites(readGuestFavorites());
      applyMode("guest");
    }
  }, [applyMode]);

  useEffect(() => {
    // Defer the first load to a microtask so the effect does not set state
    // synchronously during mount.
    void Promise.resolve().then(loadFavorites);

    function handleAuthChange() {
      setFavorites([]);
      applyMode("loading");
      void loadFavorites();
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [loadFavorites, applyMode]);

  useEffect(() => {
    if (mode !== "guest") {
      return;
    }

    try {
      localStorage.setItem(
        GUEST_FAVORITES_KEY,
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.error("Could not save your favorites:", error);
    }
  }, [favorites, mode]);

  const sendMutation = useCallback(
    async (
      method: "POST" | "DELETE",
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
          throw new Error(`Favorites ${method} failed.`);
        }
      } catch (error) {
        console.error("Favorites update error:", error);

        void loadFavorites();
      }
    },
    [loadFavorites]
  );

  const addFavorite = useCallback(
    (product: FavoriteProduct) => {
      if (favorites.some((item) => item.id === product.id)) {
        return;
      }

      setFavorites((prev) =>
        prev.some((item) => item.id === product.id)
          ? prev
          : [...prev, product]
      );

      if (modeRef.current === "account") {
        void sendMutation("POST", "/api/favorites", {
          productId: product.id,
        });
      }
    },
    [favorites, sendMutation]
  );

  const removeFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) =>
        prev.filter((item) => item.id !== id)
      );

      if (modeRef.current === "account") {
        void sendMutation(
          "DELETE",
          `/api/favorites?productId=${id}`
        );
      }
    },
    [sendMutation]
  );

  const toggleFavorite = useCallback(
    (product: FavoriteProduct) => {
      const exists = favorites.some(
        (item) => item.id === product.id
      );

      setFavorites((prev) => {
        if (exists) {
          return prev.filter((item) => item.id !== product.id);
        }

        return prev.some((item) => item.id === product.id)
          ? prev
          : [...prev, product];
      });

      if (modeRef.current === "account") {
        if (exists) {
          void sendMutation(
            "DELETE",
            `/api/favorites?productId=${product.id}`
          );
        } else {
          void sendMutation("POST", "/api/favorites", {
            productId: product.id,
          });
        }
      }
    },
    [favorites, sendMutation]
  );

  const isFavorite = useCallback(
    (id: number) => favorites.some((item) => item.id === id),
    [favorites]
  );

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        loading: mode === "loading",
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoriteContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoriteProvider"
    );
  }

  return context;
}
