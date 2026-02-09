import { Elysia } from "elysia";
import { CartController } from "../controller/cart.controller";
import { jwtMiddleware, type AuthContext } from "../middleware/jwt.middleware";

/**
 * Cart Routes
 * All routes require authentication
 */
export const cartRoutes = new Elysia({ prefix: "/api/cart" })
    /**
     * Get user's cart
     * GET /api/cart
     */
    .get(
        "/",
        async (context) => {
            return CartController.getCart(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Add product to cart
     * POST /api/cart/add
     * Body: { productId: string, quantity?: number }
     */
    .post(
        "/add",
        async (context) => {
            return CartController.addToCart(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Reduce product quantity by 1
     * POST /api/cart/reduce
     * Body: { productId: string }
     */
    .post(
        "/reduce",
        async (context) => {
            return CartController.reduceQuantity(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Update product quantity
     * PUT /api/cart/update
     * Body: { productId: string, quantity: number }
     */
    .put(
        "/update",
        async (context) => {
            return CartController.updateQuantity(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Remove product from cart
     * DELETE /api/cart/remove/:productId
     */
    .delete(
        "/remove/:productId",
        async (context) => {
            return CartController.removeFromCart(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Clear entire cart
     * DELETE /api/cart/clear
     */
    .delete(
        "/clear",
        async (context) => {
            return CartController.clearCart(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    )

    /**
     * Apply coupon code
     * POST /api/cart/coupon
     * Body: { couponCode: string }
     */
    .post(
        "/coupon",
        async (context) => {
            return CartController.applyCoupon(context as unknown as AuthContext);
        },
        {
            beforeHandle: jwtMiddleware,
        }
    );

export default cartRoutes;
