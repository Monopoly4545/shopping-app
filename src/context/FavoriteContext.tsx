
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type FavoriteProduct = {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category?: string;
  rating?: number;
};

type FavoriteContextType = {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: string | number) => void;
  toggleFavorite: (product: FavoriteProduct) => void;
  isFavorite: (id: string | number) => boolean;
};

const FavoriteContext = createContext<FavoriteContextType | undefined>(
  undefined
);

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("favorites");

    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        localStorage.removeItem("favorites");
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  const addFavorite = (product: FavoriteProduct) => {
    setFavorites((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev
        : [...prev, product]
    );
  };

  const removeFavorite = (id: string | number) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavorite = (product: FavoriteProduct) => {
    setFavorites((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product]
    );
  };

  const isFavorite = (id: string | number) =>
    favorites.some((item) => item.id === id);

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
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