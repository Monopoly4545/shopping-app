
export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  items: string;
  slug: string;
}

export const categories: Category[] = [
  {
    id: 1,
    name: "Electronics",
    description: "Gadgets, devices & accessories",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
    items: "120+ Products",
    slug: "electronics",
  },
  {
    id: 2,
    name: "Fashion",
    description: "Discover your personal style",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
    items: "250+ Products",
    slug: "fashion",
  },
  {
    id: 3,
    name: "Home & Living",
    description: "Make your space feel like home",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    items: "180+ Products",
    slug: "home-living",
  },
  {
    id: 4,
    name: "Beauty",
    description: "Care, beauty & wellness",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
    items: "90+ Products",
    slug: "beauty",
  },
  {
    id: 5,
    name: "Sports",
    description: "Gear up and stay active",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    items: "75+ Products",
    slug: "sports",
  },
  {
    id: 6,
    name: "Accessories",
    description: "The little things that matter",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    items: "140+ Products",
    slug: "accessories",
  },
];