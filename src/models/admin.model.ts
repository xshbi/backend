
import { db } from '../db/drizzle';
import { products } from '../db/schema_drizzle';
import { eq, and, gte, lte, ilike, sql } from 'drizzle-orm';

export class AdminProductModel {
    // Add a new product
    static async addProduct(productData: {
        name: string;
        description?: string;
        shortDescription?: string;
        price: number;
        categoryId?: number;
        stockQuantity: number;
        slug: string;
        sku: string;
        brand?: string;
        isActive?: boolean;
    }, adminId: number) {
        try {
            // Validate price and stock
            if (productData.price < 0) {
                return {
                    success: false,
                    message: 'Price cannot be negative'
                };
            }

            // Helper function to convert empty strings to undefined
            const toNullable = (value: any) => {
                if (value === '' || value === null || value === undefined) {
                    return undefined;
                }
                return value;
            };

            const [product] = await db.insert(products).values({
                name: productData.name,
                slug: productData.slug,
                sku: productData.sku,
                description: toNullable(productData.description),
                shortDescription: toNullable(productData.shortDescription),
                price: productData.price.toString(), // Drizzle decimal needs string
                categoryId: toNullable(productData.categoryId),
                brand: toNullable(productData.brand),
                stockQuantity: productData.stockQuantity || 0,
                isActive: productData.isActive !== undefined ? productData.isActive : true,
                vendorId: adminId
                // Let database handle createdAt and updatedAt with defaultNow()
            }).returning();

            return {
                success: true,
                message: 'Product added successfully',
                product
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to add product',
                error
            };
        }
    }

    // Remove (delete) a product
    static async removeProduct(productId: number) {
        try {
            const [deletedProduct] = await db
                .delete(products)
                .where(eq(products.id, productId))
                .returning();

            if (!deletedProduct) {
                return {
                    success: false,
                    message: 'Product not found'
                };
            }

            return {
                success: true,
                message: 'Product removed successfully',
                product: deletedProduct
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to remove product',
                error
            };
        }
    }

    // Get all products (Admin view)
    static async getAllProducts() {
        const allProducts = await db.select().from(products);
        return {
            success: true,
            products: allProducts
        };
    }

    // Update product stock
    static async updateStock(productId: number, quantity: number, type: 'add' | 'reduce' | 'set') {
        try {
            const currentProduct = await db.select().from(products).where(eq(products.id, productId));

            if (!currentProduct.length || !currentProduct[0]) {
                return {
                    success: false,
                    message: 'Product not found'
                };
            }

            let newStock = currentProduct[0].stockQuantity;

            if (type === 'add') {
                newStock += quantity;
            } else if (type === 'reduce') {
                newStock -= quantity;
            } else {
                newStock = quantity; // set
            }

            if (newStock < 0) {
                return {
                    success: false,
                    message: 'Stock cannot be negative'
                };
            }

            const [updatedProduct] = await db
                .update(products)
                .set({ stockQuantity: newStock, updatedAt: new Date() })
                .where(eq(products.id, productId))
                .returning();

            return {
                success: true,
                message: 'Stock updated successfully',
                product: updatedProduct
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update stock',
                error
            };
        }
    }
}