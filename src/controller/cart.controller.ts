import type { AuthContext } from "../middleware/jwt.middleware";
import { CartModel, type Cart, type Product } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { sql } from "../db/schema";

/**
 * Cart Controller
 * Handles all cart-related operations.
 * Uses BOTH in-memory storage (for fast reads) AND the DB `cart` table
 * so that OrderModel.createFromCart() can read items correctly.
 */

// In-memory cart storage (for fast reads / summary)
const cartStorage = new Map<number, Cart>();

// ── DB helpers ──────────────────────────────────────────────────────────────

/** Upsert a row in the DB `cart` table.
 *  NULL values don't match in UNIQUE constraints in PostgreSQL,
 *  so we use a DELETE + INSERT pattern for items without variants.
 */
async function dbUpsertCartItem(userId: number, productId: number, quantity: number) {
    // Delete existing row first (handles NULL variant case)
    await sql`
        DELETE FROM cart
        WHERE user_id = ${userId}
          AND product_id = ${productId}
          AND variant_size IS NULL
          AND variant_color IS NULL
    `;
    // Insert fresh row
    await sql`
        INSERT INTO cart (user_id, product_id, quantity, variant_size, variant_color)
        VALUES (${userId}, ${productId}, ${quantity}, NULL, NULL)
    `;
}

/** Delete a row from the DB `cart` table */
async function dbRemoveCartItem(userId: number, productId: number) {
    await sql`
        DELETE FROM cart WHERE user_id = ${userId} AND product_id = ${productId}
    `;
}

/** Clear all rows for a user from the DB `cart` table */
async function dbClearCart(userId: number) {
    await sql`DELETE FROM cart WHERE user_id = ${userId}`;
}

// ── Controller ──────────────────────────────────────────────────────────────

export class CartController {
    /**
     * Get user's cart
     * GET /api/cart
     */
    static async getCart(context: AuthContext) {
        try {
            const userId = context.user?.userId;

            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            // Get or create cart for user
            let cart = cartStorage.get(userId);
            if (!cart) {
                cart = CartModel.createCart(userId.toString());
                cartStorage.set(userId, cart);
            }

            const summary = CartModel.getCartSummary(cart);

            return { success: true, data: { cart, summary } };
        } catch (error) {
            console.error("Error getting cart:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to retrieve cart",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Add product to cart
     * POST /api/cart/add
     * Body: { productId: string, quantity: number }
     */
    static async addToCart(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const { productId, quantity = 1 } = context.body as { productId: string; quantity?: number };

            if (!productId) {
                context.set.status = 400;
                return { success: false, message: "Product ID is required" };
            }

            if (quantity <= 0) {
                context.set.status = 400;
                return { success: false, message: "Quantity must be greater than 0" };
            }

            // Fetch product from database
            const dbProduct = await ProductModel.findById(parseInt(productId));
            if (!dbProduct) {
                context.set.status = 404;
                return { success: false, message: "Product not found" };
            }

            const product: Product = {
                id: dbProduct.id.toString(),
                name: dbProduct.name,
                description: dbProduct.description || undefined,
                price: parseFloat(dbProduct.price),
                imageUrl: dbProduct.images?.[0] || undefined,
                category: dbProduct.category_id?.toString(),
                stock: dbProduct.stock_quantity,
            };

            // Get or create in-memory cart
            let cart = cartStorage.get(userId);
            if (!cart) {
                cart = CartModel.createCart(userId.toString());
            }

            // Stock check
            const existingItem = CartModel.findCartItem(cart.items, product.id);
            const currentQuantity = existingItem?.quantity || 0;

            if (!CartModel.canAddToCart(product, quantity, currentQuantity)) {
                context.set.status = 400;
                return {
                    success: false,
                    message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity + currentQuantity}`,
                };
            }

            // Update in-memory cart
            cart = CartModel.addItem(cart, product, quantity);
            cartStorage.set(userId, cart);

            // Sync to DB cart table so OrderModel can read it
            const newQty = (existingItem?.quantity || 0) + quantity;
            await dbUpsertCartItem(userId, parseInt(productId), newQty);

            const summary = CartModel.getCartSummary(cart);

            return {
                success: true,
                message: "Product added to cart successfully",
                data: { cart, summary },
            };
        } catch (error) {
            console.error("Error adding to cart:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to add product to cart",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Reduce product quantity in cart (decrease by 1)
     * POST /api/cart/reduce
     */
    static async reduceQuantity(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const { productId } = context.body as { productId: string };
            if (!productId) {
                context.set.status = 400;
                return { success: false, message: "Product ID is required" };
            }

            let cart = cartStorage.get(userId);
            if (!cart) {
                context.set.status = 404;
                return { success: false, message: "Cart not found" };
            }

            const existingItem = CartModel.findCartItem(cart.items, productId);
            if (!existingItem) {
                context.set.status = 404;
                return { success: false, message: "Product not found in cart" };
            }

            const newQuantity = existingItem.quantity - 1;

            if (newQuantity <= 0) {
                cart = CartModel.removeItem(cart, productId);
                await dbRemoveCartItem(userId, parseInt(productId));
            } else {
                cart = CartModel.updateQuantity(cart, productId, newQuantity);
                await dbUpsertCartItem(userId, parseInt(productId), newQuantity);
            }

            cartStorage.set(userId, cart);
            const summary = CartModel.getCartSummary(cart);

            return {
                success: true,
                message: newQuantity <= 0 ? "Product removed from cart" : "Product quantity reduced",
                data: { cart, summary },
            };
        } catch (error) {
            console.error("Error reducing quantity:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to reduce product quantity",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Update product quantity in cart
     * PUT /api/cart/update
     */
    static async updateQuantity(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const { productId, quantity } = context.body as { productId: string; quantity: number };

            if (!productId) {
                context.set.status = 400;
                return { success: false, message: "Product ID is required" };
            }

            if (quantity < 0) {
                context.set.status = 400;
                return { success: false, message: "Quantity cannot be negative" };
            }

            let cart = cartStorage.get(userId);
            if (!cart) {
                context.set.status = 404;
                return { success: false, message: "Cart not found" };
            }

            const existingItem = CartModel.findCartItem(cart.items, productId);
            if (!existingItem) {
                context.set.status = 404;
                return { success: false, message: "Product not found in cart" };
            }

            if (!CartModel.canAddToCart(existingItem.product, quantity, 0)) {
                context.set.status = 400;
                return { success: false, message: `Insufficient stock. Available: ${existingItem.product.stock}` };
            }

            cart = CartModel.updateQuantity(cart, productId, quantity);
            cartStorage.set(userId, cart);

            // Sync to DB
            if (quantity <= 0) {
                await dbRemoveCartItem(userId, parseInt(productId));
            } else {
                await dbUpsertCartItem(userId, parseInt(productId), quantity);
            }

            const summary = CartModel.getCartSummary(cart);

            return {
                success: true,
                message: quantity === 0 ? "Product removed from cart" : "Product quantity updated",
                data: { cart, summary },
            };
        } catch (error) {
            console.error("Error updating quantity:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to update product quantity",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Remove product from cart
     * DELETE /api/cart/remove/:productId
     */
    static async removeFromCart(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const { productId } = context.params as { productId: string };
            if (!productId) {
                context.set.status = 400;
                return { success: false, message: "Product ID is required" };
            }

            let cart = cartStorage.get(userId);
            if (!cart) {
                context.set.status = 404;
                return { success: false, message: "Cart not found" };
            }

            cart = CartModel.removeItem(cart, productId);
            cartStorage.set(userId, cart);

            // Sync to DB
            await dbRemoveCartItem(userId, parseInt(productId));

            const summary = CartModel.getCartSummary(cart);

            return {
                success: true,
                message: "Product removed from cart",
                data: { cart, summary },
            };
        } catch (error) {
            console.error("Error removing from cart:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to remove product from cart",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Clear all items from cart
     * DELETE /api/cart/clear
     */
    static async clearCart(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            let cart = cartStorage.get(userId);
            if (!cart) {
                cart = CartModel.createCart(userId.toString());
            } else {
                cart = CartModel.clearCart(cart);
            }

            cartStorage.set(userId, cart);
            await dbClearCart(userId);

            return { success: true, message: "Cart cleared successfully", data: { cart } };
        } catch (error) {
            console.error("Error clearing cart:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to clear cart",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Apply coupon code to cart
     * POST /api/cart/coupon
     */
    static async applyCoupon(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const { couponCode } = context.body as { couponCode: string };
            if (!couponCode) {
                context.set.status = 400;
                return { success: false, message: "Coupon code is required" };
            }

            let cart = cartStorage.get(userId);
            if (!cart) {
                context.set.status = 404;
                return { success: false, message: "Cart not found" };
            }

            const validCoupons: Record<string, number> = {
                "SAVE10": 10,
                "SAVE20": 20,
                "WELCOME": 15,
            };

            const discountAmount = validCoupons[couponCode.toUpperCase()];
            if (!discountAmount) {
                context.set.status = 400;
                return { success: false, message: "Invalid coupon code" };
            }

            cart = CartModel.applyDiscount(cart, couponCode, discountAmount);
            cartStorage.set(userId, cart);

            const summary = CartModel.getCartSummary(cart);

            return {
                success: true,
                message: `Coupon applied! You saved ₹${discountAmount}`,
                data: { cart, summary },
            };
        } catch (error) {
            console.error("Error applying coupon:", error);
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to apply coupon",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}

export default CartController;
