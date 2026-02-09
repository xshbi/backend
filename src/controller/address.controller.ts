
import { AddressModel, type AddressFormData } from "../models/address.model";
import type { AuthContext } from "../middleware/jwt.middleware";

export class AddressController {
    /**
     * Get all addresses for user
     * GET /api/addresses
     */
    static async getAddresses(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const addresses = await AddressModel.findByUserId(userId);
            return {
                success: true,
                data: addresses
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to fetch addresses",
                error: error.message
            };
        }
    }

    /**
     * Create address
     * POST /api/addresses
     */
    static async createAddress(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            const body = context.body as AddressFormData;

            // Validate basic fields (though model validates too)
            if (!body.street || !body.city || !body.fullName || !body.phone) {
                context.set.status = 400;
                return { success: false, message: "Missing required fields" };
            }

            const address = await AddressModel.create(userId, body);
            return {
                success: true,
                message: "Address created successfully",
                data: address
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to create address",
                error: error.message
            };
        }
    }

    /**
     * Delete address
     * DELETE /api/addresses/:id
     */
    static async deleteAddress(context: AuthContext) {
        try {
            const userId = context.user?.userId;
            if (!userId) {
                context.set.status = 401;
                return { success: false, message: "User not authenticated" };
            }

            if (!context.params.id) {
                context.set.status = 400;
                return { success: false, message: "ID is required" };
            }
            const id = parseInt(context.params.id);
            const success = await AddressModel.delete(id, userId);

            if (!success) {
                context.set.status = 404;
                return { success: false, message: "Address not found" };
            }

            return {
                success: true,
                message: "Address deleted successfully"
            };
        } catch (error: any) {
            context.set.status = 500;
            return {
                success: false,
                message: "Failed to delete address",
                error: error.message
            };
        }
    }
}
