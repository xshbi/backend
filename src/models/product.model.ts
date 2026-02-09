// db/schema.ts (Product Tables)
import { sql } from '../db/schema';

// Create categories table
export const createCategoriesTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      image_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`;
};

// Create products table
export const createProductsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_description VARCHAR(500),
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
      compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
      cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand VARCHAR(100),
      stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
      low_stock_threshold INTEGER DEFAULT 10,
      weight DECIMAL(10, 2),
      weight_unit VARCHAR(10) DEFAULT 'kg',
      dimensions JSONB,
      is_active BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      is_flagged BOOLEAN DEFAULT FALSE,
      flag_reason TEXT,
      meta_title VARCHAR(255),
      meta_description TEXT,
      meta_keywords TEXT,
      vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_is_flagged ON products(is_flagged)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)`;
};

// Create product images table
export const createProductImagesTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      public_id VARCHAR(255),
      alt_text VARCHAR(255),
      is_primary BOOLEAN DEFAULT FALSE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)`;
};

// Create product variants table
export const createProductVariantsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10, 2) CHECK (price >= 0),
      stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
      attributes JSONB,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku)`;
};

// Create product reviews table
export const createProductReviewsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(200),
      comment TEXT,
      is_verified_purchase BOOLEAN DEFAULT FALSE,
      is_approved BOOLEAN DEFAULT FALSE,
      helpful_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(product_id, user_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating)`;
};

// Create product tags table
export const createProductTagsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_tags (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, tag_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id)`;
};

// models/Product.ts

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  category_id?: number;
  brand?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  weight?: number;
  weight_unit: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  is_active: boolean;
  is_featured: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  vendor_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  public_id?: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price?: number;
  stock_quantity: number;
  attributes?: {
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ProductModel {
  // Create product
  static async create(productData: {
    name: string;
    slug: string;
    sku: string;
    price: number;
    description?: string;
    short_description?: string;
    category_id?: number;
    stock_quantity?: number;
    brand?: string;
    vendor_id?: number;
  }): Promise<Product> {
    const [product] = await sql`
      INSERT INTO products ${sql(productData)}
      RETURNING *
    `;
    return product;
  }

  // Flag product
  static async flag(id: number, reason: string): Promise<boolean> {
    const result = await sql`
      UPDATE products 
      SET is_flagged = TRUE, flag_reason = ${reason}, is_active = FALSE, updated_at = NOW()
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Unflag product
  static async unflag(id: number): Promise<boolean> {
    const result = await sql`
      UPDATE products 
      SET is_flagged = FALSE, flag_reason = NULL, is_active = TRUE, updated_at = NOW()
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Find product by ID with full details
  static async findById(id: number) {
    const [product] = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `;

    if (!product) return null;

    const images = await sql`
      SELECT * FROM product_images WHERE product_id = ${id} ORDER BY sort_order, is_primary DESC
    `;

    const variants = await sql`
      SELECT * FROM product_variants WHERE product_id = ${id} AND is_active = TRUE
    `;

    const tags = await sql`
      SELECT t.* FROM tags t
      JOIN product_tags pt ON t.id = pt.tag_id
      WHERE pt.product_id = ${id}
    `;

    const reviews = await this.getProductReviews(id);
    const rating = await this.getAverageRating(id);

    return {
      ...product,
      images,
      variants,
      tags,
      reviews,
      average_rating: rating.average,
      review_count: rating.count
    };
  }

  // Find product by slug
  static async findBySlug(slug: string) {
    const [product] = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${slug}
    `;

    if (!product) return null;
    return this.findById(product.id);
  }

  // Get all products with filters
  static async findAll(filters: {
    category_id?: number;
    brand?: string;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'price' | 'created_at' | 'name' | 'popularity';
    sort_order?: 'ASC' | 'DESC';
  } = {}) {
    const {
      category_id,
      brand,
      min_price,
      max_price,
      is_featured,
      search,
      limit = 20,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    let query = sql`
      SELECT p.*, c.name as category_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;

    if (category_id) {
      query = sql`${query} AND p.category_id = ${category_id}`;
    }

    if (brand) {
      query = sql`${query} AND p.brand = ${brand}`;
    }

    if (min_price !== undefined) {
      query = sql`${query} AND p.price >= ${min_price}`;
    }

    if (max_price !== undefined) {
      query = sql`${query} AND p.price <= ${max_price}`;
    }

    if (is_featured !== undefined) {
      query = sql`${query} AND p.is_featured = ${is_featured}`;
    }

    if (search) {
      query = sql`${query} AND (p.name ILIKE ${'%' + search + '%'} OR p.description ILIKE ${'%' + search + '%'})`;
    }

    query = sql`${query} ORDER BY p.${sql(sort_by)} ${sql.unsafe(sort_order)} LIMIT ${limit} OFFSET ${offset}`;

    const products = await query;
    return products;
  }

  // Update product
  static async update(id: number, updates: Partial<Product>): Promise<Product | null> {
    const [product] = await sql`
      UPDATE products 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return product || null;
  }

  // Delete product
  static async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM products WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Update stock quantity
  static async updateStock(id: number, quantity: number): Promise<void> {
    await sql`
      UPDATE products 
      SET stock_quantity = stock_quantity + ${quantity}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  // Check if product is in stock
  static async isInStock(id: number, requestedQuantity: number = 1): Promise<boolean> {
    const [product] = await sql`
      SELECT stock_quantity FROM products WHERE id = ${id}
    `;
    return product ? product.stock_quantity >= requestedQuantity : false;
  }

  // Add product image
  static async addImage(imageData: {
    product_id: number;
    url: string;
    public_id?: string;
    alt_text?: string;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<ProductImage> {
    const [image] = await sql`
      INSERT INTO product_images ${sql(imageData)}
      RETURNING *
    `;
    return image;
  }

  // Get product reviews
  static async getProductReviews(productId: number) {
    const reviews = await sql`
      SELECT r.*, u.first_name, u.last_name, u.avatar_url
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${productId} AND r.is_approved = TRUE
      ORDER BY r.created_at DESC
    `;
    return reviews;
  }

  // Add product review
  static async addReview(reviewData: {
    product_id: number;
    user_id: number;
    rating: number;
    title?: string;
    comment?: string;
    is_verified_purchase?: boolean;
  }): Promise<ProductReview> {
    const [review] = await sql`
      INSERT INTO product_reviews ${sql(reviewData)}
      RETURNING *
    `;
    return review;
  }

  // Get average rating
  static async getAverageRating(productId: number) {
    const [result] = await sql`
      SELECT 
        COALESCE(AVG(rating), 0) as average,
        COUNT(*) as count
      FROM product_reviews
      WHERE product_id = ${productId} AND is_approved = TRUE
    `;
    return {
      average: parseFloat(result.average).toFixed(1),
      count: parseInt(result.count)
    };
  }

  // Get related products
  static async getRelatedProducts(productId: number, limit: number = 4) {
    const [product] = await sql`
      SELECT category_id FROM products WHERE id = ${productId}
    `;

    if (!product) return [];

    const relatedProducts = await sql`
      SELECT p.*, 
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
      FROM products p
      WHERE p.category_id = ${product.category_id} 
        AND p.id != ${productId}
        AND p.is_active = TRUE
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    return relatedProducts;
  }
}

// Category Model
export class CategoryModel {
  static async create(categoryData: {
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    image_url?: string;
  }): Promise<Category> {
    const [category] = await sql`
      INSERT INTO categories ${sql(categoryData)}
      RETURNING *
    `;
    return category;
  }

  static async findAll() {
    const categories = await sql`
      SELECT * FROM categories WHERE is_active = TRUE ORDER BY name
    `;
    return categories;
  }

  static async findBySlug(slug: string) {
    const [category] = await sql`
      SELECT * FROM categories WHERE slug = ${slug}
    `;
    return category || null;
  }

  static async getWithProductCount() {
    const categories = await sql`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.name
    `;
    return categories;
  }
}