import type { Product } from "@/types/shop";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  rating?: number;
}
