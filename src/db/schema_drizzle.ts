
import { pgTable, serial, text, integer, decimal, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Products table matching the SQL definition
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),
    sku: text('sku').notNull().unique(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    categoryId: integer('category_id'),
    brand: text('brand'),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    vendorId: integer('vendor_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Users table (for admin/vendor reference)
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    avatarPublicId: text('avatar_public_id'),
    role: text('role').notNull().default('customer'), // customer, admin, vendor
    emailVerified: boolean('email_verified').default(false),
    phoneVerified: boolean('phone_verified').default(false),
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login'),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordExpire: timestamp('reset_password_expire'),
    emailVerificationToken: text('email_verification_token'),
    emailVerificationExpire: timestamp('email_verification_expire'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Relations
export const productsRelations = relations(products, ({ one }) => ({
    vendor: one(users, {
        fields: [products.vendorId],
        references: [users.id]
    })
}));
