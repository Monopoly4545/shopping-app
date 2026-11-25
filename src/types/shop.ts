
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  items: string;
  slug: string;
}