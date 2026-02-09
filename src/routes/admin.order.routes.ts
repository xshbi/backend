import { Elysia } from "elysia";
import { OrderController } from "../controller/order.controller";
import { jwtMiddleware, requireAdmin, type AuthContext } from "../middleware/jwt.middleware";

export const adminOrderRoutes = new Elysia({ prefix: "/api/admin/orders" })
    // Middleware to ensure user is authenticated and is an admin
    .onBeforeHandle(async (context) => {
        const authResult = await jwtMiddleware(context as unknown as AuthContext);
        if (authResult) return authResult;

        const adminResult = await requireAdmin(context as unknown as AuthContext);
        if (adminResult) return adminResult;
    })

    /**
     * @route GET /api/admin/orders
     * @desc Get all orders with filtering options
     * @query status - Filter by order status (pending, confirmed, shipped, delivered, etc.)
     * @query payment_status - Filter by payment status (pending, paid, failed, etc.)
     * @query search - Search by order number or user email
     * @query date_from - Filter orders from this date
     * @query date_to - Filter orders until this date
     * @query limit - Number of results (default: 50)
     * @query offset - Pagination offset (default: 0)
     */
    .get("/", async (context) => {
        return await OrderController.getAllOrders(context as unknown as AuthContext);
    })

    /**
     * @route GET /api/admin/orders/statistics
     * @desc Get overall order statistics (total orders, revenue, average order value)
     */
    .get("/statistics", async (context) => {
        return await OrderController.getOrderStatistics(context as unknown as AuthContext);
    })

    /**
     * @route GET /api/admin/orders/user/:userId
     * @desc Get all orders for a specific user with their statistics
     * @param userId - User ID
     * @query limit - Number of results (default: 20)
     * @query offset - Pagination offset (default: 0)
     */
    .get("/user/:userId", async (context) => {
        return await OrderController.getUserOrdersAdmin(context as unknown as AuthContext);
    })

    /**
     * @route PATCH /api/admin/orders/:id/status
     * @desc Update order status
     * @param id - Order ID
     * @body status - New status (pending, confirmed, processing, shipped, delivered, cancelled, etc.)
     * @body notes - Optional admin notes about the status change
     */
    .patch("/:id/status", async (context) => {
        return await OrderController.updateOrderStatus(context as unknown as AuthContext);
    });
