// models/User.ts
import { sql } from '../db/schema';

// Create users table
export const createUsersTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      avatar_url TEXT,
      avatar_public_id VARCHAR(255),
      role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'vendor')),
      email_verified BOOLEAN DEFAULT FALSE,
      phone_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP,
      reset_password_token VARCHAR(255),
      reset_password_expire TIMESTAMP,
      email_verification_token VARCHAR(255),
      email_verification_expire TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`;
};

// Create addresses table
export const createAddressesTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) DEFAULT 'home' CHECK (type IN ('home', 'work', 'other')),
      full_name VARCHAR(200) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      country VARCHAR(100) DEFAULT 'India',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)`;
};

// Create wishlist table
export const createWishlistTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS wishlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id)`;
};

// Create cart table
export const createCartTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
      variant_size VARCHAR(50),
      variant_color VARCHAR(50),
      added_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, product_id, variant_size, variant_color)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)`;
};

// models/User.ts

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  avatar_url?: string;
  avatar_public_id?: string;
  role: 'customer' | 'admin' | 'vendor';
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  last_login?: Date;
  reset_password_token?: string;
  reset_password_expire?: Date;
  email_verification_token?: string;
  email_verification_expire?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  id: number;
  user_id: number;
  type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  variant_size?: string;
  variant_color?: string;
  added_at: Date;
  updated_at: Date;
}

export class UserModel {
  // Create user
  static async create(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
    phone?: string;
    role?: 'customer' | 'admin' | 'vendor';
  }): Promise<User> {
    const [user] = await sql`
      INSERT INTO users ${sql(userData)}
      RETURNING *
    `;
    return user;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return user || null;
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const [user] = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return user || null;
  }

  // Update user
  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    const [user] = await sql`
      UPDATE users 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return user || null;
  }

  // Update last login
  static async updateLastLogin(id: number): Promise<void> {
    await sql`
      UPDATE users SET last_login = NOW() WHERE id = ${id}
    `;
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Get user with addresses
  static async findWithAddresses(id: number) {
    const user = await this.findById(id);
    if (!user) return null;

    const addresses = await sql`
      SELECT * FROM addresses WHERE user_id = ${id} ORDER BY is_default DESC, created_at DESC
    `;

    return { ...user, addresses };
  }

  // Get user cart
  static async getCart(userId: number) {
    const cart = await sql`
      SELECT c.*, p.name, p.price, p.image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${userId}
      ORDER BY c.added_at DESC
    `;
    return cart;
  }

  // Add to cart
  static async addToCart(
    userId: number,
    productId: number,
    quantity: number = 1,
    variant?: { size?: string; color?: string }
  ) {
    const [item] = await sql`
      INSERT INTO cart (user_id, product_id, quantity, variant_size, variant_color)
      VALUES (${userId}, ${productId}, ${quantity}, ${variant?.size || null}, ${variant?.color || null})
      ON CONFLICT (user_id, product_id, variant_size, variant_color)
      DO UPDATE SET quantity = cart.quantity + ${quantity}, updated_at = NOW()
      RETURNING *
    `;
    return item;
  }

  // Remove from cart
  static async removeFromCart(userId: number, cartItemId: number) {
    const result = await sql`
      DELETE FROM cart WHERE id = ${cartItemId} AND user_id = ${userId}
    `;
    return result.count > 0;
  }

  // Clear cart
  static async clearCart(userId: number) {
    await sql`
      DELETE FROM cart WHERE user_id = ${userId}
    `;
  }

  // Get wishlist
  static async getWishlist(userId: number) {
    const wishlist = await sql`
      SELECT w.*, p.name, p.price, p.image_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${userId}
      ORDER BY w.added_at DESC
    `;
    return wishlist;
  }

  // Add to wishlist
  static async addToWishlist(userId: number, productId: number) {
    const [item] = await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${userId}, ${productId})
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `;
    return item;
  }

  // Remove from wishlist
  static async removeFromWishlist(userId: number, productId: number) {
    const result = await sql`
      DELETE FROM wishlist WHERE user_id = ${userId} AND product_id = ${productId}
    `;
    return result.count > 0;
  }
}

// utils/password.ts
export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10
    });
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }
}