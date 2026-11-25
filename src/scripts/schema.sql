
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    items VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= 0),
    rating NUMERIC(2, 1) NOT NULL CHECK (rating BETWEEN 0 AND 5),
    reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
    image TEXT NOT NULL,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_sale BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category_id);