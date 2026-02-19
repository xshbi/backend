
import { OrderModel } from "../models/order.model";
import { AddressModel } from "../models/address.model";
import type { AuthContext } from "../middleware/jwt.middleware";

export class OrderController {
    /**
     * Create Order (Checkout)
     * POST /api/orders
     */
    static async createOrder(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const body = context.body as any;
            let { shippingAddressId, billingAddressId } = body;

            // 1. Validate Address Existence
            // If ID not provided, try to find default
            if (!shippingAddressId) {
                const addresses = await AddressModel.findByUserId(userId);
                if (addresses.length === 0) {
                    context.set.status = 400;
                    return {
                        success: false,
                        message: "No address found. Please add an address before processing payment.",
                        actionRequired: "ADD_ADDRESS"
                    };
                }

                // Use default or first
                const defaultAddr = (addresses.find(a => a.isDefault) || addresses[0])!;
                shippingAddressId = defaultAddr.id!;
            }

            if (!billingAddressId) {
                billingAddressId = shippingAddressId; // Default to shipping
            }

            // 2. Create Order
            const result = await OrderModel.createFromCart({
                user_id: userId,
                shipping_address_id: shippingAddressId,
                billing_address_id: billingAddressId,
                shipping_method: body.shippingMethod,
                customer_notes: body.notes,
                coupon_code: body.couponCode
            });

            return {
                success: true,
                message: "Order placed successfully",
                data: result
            };

        } catch (error: any) {
            console.error("Checkout Error:", error);
            context.set.status = 500;
            return {
                success: false,
                message: error.message || "Failed to place order",
            };
        }
    }

    /**
     * Get User Orders
     * GET /api/orders
     */
    static async getUserOrders(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const orders = await OrderModel.getUserOrders(userId);
            return {
                success: true,
                data: orders
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch orders",
                error: error.message
            };
        }
    }

    /**
     * Get Order Details by ID
     * GET /api/orders/:id
     */
    static async getOrderById(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            const userRole = context.user?.role;
            const params = context.params as any;
            const orderId = parseInt(params.id);

            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const order = await OrderModel.findById(orderId);

            if (!order) {
                context.set.status = 404;
                return { success: false, message: "Order not found" };
            }

            // Check if user owns this order (unless admin)
            if (userRole !== 'admin' && order.user_id !== userId) {
                context.set.status = 403;
                return { success: false, message: "Access denied" };
            }

            return {
                success: true,
                data: order
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch order details",
                error: error.message
            };
        }
    }

    /**
     * Update Order Status (Vendor / Customer-facing)
     * PATCH /api/orders/:id/status
     */
    static async updateOrderStatusVendor(context: AuthContext) {
        try {
            const params = context.params as any;
            const body = context.body as any;
            const userId = context.user?.userId;
            const userRole = context.user?.role;
            const orderId = parseInt(params.id);

            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            if (!body.status) {
                context.set.status = 400;
                return { success: false, message: "Status is required" };
            }

            // Allowed forward transitions (vendor can't go backwards)
            const ALLOWED: Record<string, string[]> = {
                pending: ['confirmed', 'cancelled'],
                confirmed: ['processing', 'cancelled'],
                processing: ['packed', 'cancelled'],
                packed: ['shipped'],
                shipped: ['out_for_delivery'],
                out_for_delivery: ['delivered'],
            };

            const order = await OrderModel.findById(orderId);
            if (!order) {
                context.set.status = 404;
                return { success: false, message: "Order not found" };
            }

            // Only vendor or admin can update
            if (userRole !== 'admin' && userRole !== 'vendor') {
                context.set.status = 403;
                return { success: false, message: "Access denied" };
            }

            const allowed = ALLOWED[order.status] ?? [];
            if (!allowed.includes(body.status)) {
                context.set.status = 400;
                return {
                    success: false,
                    message: `Cannot transition from '${order.status}' to '${body.status}'`
                };
            }

            const updated = await OrderModel.updateStatus(orderId, body.status, userId, body.notes);

            return {
                success: true,
                message: "Order status updated successfully",
                data: updated
            };
        } catch (error: any) {
            context.set.status = 400;
            return {
                success: false,
                message: error.message || "Failed to update order status"
            };
        }
    }

    /**
     * Cancel Order
     * POST /api/orders/:id/cancel
     */
    static async cancelOrder(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            const params = context.params as any;
            const body = context.body as any;
            const orderId = parseInt(params.id);

            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const order = await OrderModel.cancel(orderId, userId, body.reason);

            return {
                success: true,
                message: "Order cancelled successfully",
                data: order
            };
        } catch (error: any) {
            context.set.status = 400;
            return {
                success: false,
                message: error.message || "Failed to cancel order"
            };
        }
    }

    /**
     * Get User Order Statistics
     * GET /api/orders/stats
     */
    static async getUserOrderStats(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const stats = await OrderModel.getStats(userId);
            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch order statistics",
                error: error.message
            };
        }
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get All Orders (Admin)
     * GET /api/admin/orders
     */
    static async getAllOrders(context: AuthContext) {
        try {
            const query = context.query as any;

            const filters = {
                status: query.status,
                payment_status: query.payment_status,
                search: query.search,
                date_from: query.date_from ? new Date(query.date_from) : undefined,
                date_to: query.date_to ? new Date(query.date_to) : undefined,
                limit: query.limit ? parseInt(query.limit) : 50,
                offset: query.offset ? parseInt(query.offset) : 0
            };

            const orders = await OrderModel.getAllOrders(filters);

            return {
                success: true,
                data: orders,
                filters
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch orders",
                error: error.message
            };
        }
    }

    /**
     * Get Specific User's Orders (Admin)
     * GET /api/admin/orders/user/:userId
     */
    static async getUserOrdersAdmin(context: AuthContext) {
        try {
            const params = context.params as any;
            const query = context.query as any;
            const userId = parseInt(params.userId);

            const limit = query.limit ? parseInt(query.limit) : 20;
            const offset = query.offset ? parseInt(query.offset) : 0;

            const orders = await OrderModel.getUserOrders(userId, limit, offset);
            const stats = await OrderModel.getStats(userId);

            return {
                success: true,
                data: {
                    orders,
                    statistics: stats,
                    userId
                }
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch user orders",
                error: error.message
            };
        }
    }

    /**
     * Update Order Status (Admin)
     * PATCH /api/admin/orders/:id/status
     */
    static async updateOrderStatus(context: AuthContext) {
        try {
            const params = context.params as any;
            const body = context.body as any;
            const userId = context.user?.userId;
            const orderId = parseInt(params.id);

            if (!body.status) {
                context.set.status = 400;
                return {
                    success: false,
                    message: "Status is required"
                };
            }

            const order = await OrderModel.updateStatus(
                orderId,
                body.status,
                userId,
                body.notes
            );

            return {
                success: true,
                message: "Order status updated successfully",
                data: order
            };
        } catch (error: any) {
            context.set.status = 400;
            return {
                success: false,
                message: error.message || "Failed to update order status"
            };
        }
    }

    /**
     * Get Order Statistics (Admin)
     * GET /api/admin/orders/statistics
     */
    static async getOrderStatistics(context: AuthContext) {
        try {
            const stats = await OrderModel.getStats();
            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch order statistics",
                error: error.message
            };
        }
    }
}
