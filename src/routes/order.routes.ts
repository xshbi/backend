
import { Elysia } from "elysia";
import { OrderController } from "../controller/order.controller";
import { jwtMiddleware, type AuthContext } from "../middleware/jwt.middleware";

export const orderRoutes = new Elysia({ prefix: "/api/orders" })
    .onBeforeHandle(jwtMiddleware)

    // Create order from cart (checkout)
    .post("/checkout", (context) => OrderController.createOrder(context as unknown as AuthContext))

    // Get all orders for logged-in user
    .get("/", (context) => OrderController.getUserOrders(context as unknown as AuthContext))

    // Get user's order statistics
    .get("/stats", (context) => OrderController.getUserOrderStats(context as unknown as AuthContext))

    // Get specific order details
    .get("/:id", (context) => OrderController.getOrderById(context as unknown as AuthContext))

    // Cancel an order
    .post("/:id/cancel", (context) => OrderController.cancelOrder(context as unknown as AuthContext))

    // Update order status (vendor/admin)
    .patch("/:id/status", (context) => OrderController.updateOrderStatusVendor(context as unknown as AuthContext));
