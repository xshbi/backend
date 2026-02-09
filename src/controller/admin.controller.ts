
import { AdminProductModel } from "../models/admin.model";
import { UserModel, PasswordUtil } from "../models/user.model";
import { VendorModel, type Vendor } from "../models/vendor.model";
import { AuthModel } from "../models/auth.model";
import { ProductModel } from "../models/product.model";

export class AdminController {
    // ... existing ... 

    /**
     * Flag a product (Admin)
     */
    static async flagProduct(id: number, body: any) {
        try {
            const { reason } = body;

            if (!reason) {
                return {
                    success: false,
                    message: "Flag reason is required",
                    status: 400
                };
            }

            const success = await ProductModel.flag(id, reason);

            if (!success) {
                return {
                    success: false,
                    message: "Product not found or failed to flag",
                    status: 404
                };
            }

            return {
                success: true,
                message: "Product flagged and suspended successfully",
                status: 200
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to flag product",
                error: error.message,
                status: 500
            };
        }
    }

    /**
     * Create a new product (Admin or Vendor)
     */
    static async createProduct(body: any, userId: number) {
        try {
            // Extract fields, handling potential casing differences from frontend
            const {
                name,
                slug,
                sku,
                price,
                description,
                brand,
                categoryId,
                stockQuantity,
                isActive
            } = body;

            // Handle shortDescription vs short_description mismatch
            const shortDescription = body.shortDescription || body.short_description;

            // Validate required fields
            if (!name || !slug || !sku || !price) {
                return {
                    success: false,
                    message: "Missing required fields: name, slug, sku, and price are required",
                    status: 400,
                };
            }

            const productData = {
                name,
                slug,
                sku,
                price,
                description,
                shortDescription,
                brand,
                categoryId,
                stockQuantity: stockQuantity || 0,
                isActive: isActive !== undefined ? isActive : true
            };

            const result = await AdminProductModel.addProduct(productData, userId);

            return {
                ...result,
                status: result.success ? 201 : 400
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to create product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Delete product (Admin)
     */
    static async deleteProduct(id: number) {
        try {
            const result = await AdminProductModel.removeProduct(id);
            return {
                ...result,
                status: result.success ? 200 : 404
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to delete product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get all products (Admin)
     */
    static async getAllProducts() {
        const result = await AdminProductModel.getAllProducts();
        return {
            ...result,
            status: 200
        };
    }

    /**
     * Update product stock (Admin)
     */
    static async updateStock(body: any, id: number) {
        try {
            const { quantity, type } = body;

            if (quantity === undefined || !type) {
                return {
                    success: false,
                    message: "Quantity and type (add/reduce/set) are required",
                    status: 400,
                };
            }

            if (!['add', 'reduce', 'set'].includes(type)) {
                return {
                    success: false,
                    message: "Type must be one of: add, reduce, set",
                    status: 400,
                };
            }

            const result = await AdminProductModel.updateStock(id, quantity, type);

            return {
                ...result,
                status: result.success ? 200 : 400
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to update stock",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Add Vendor (Creates User + Vendor Profile)
     */
    static async addVendor(body: any) {
        try {
            // Destructure User fields and Vendor fields
            const {
                first_name, last_name, email, password, phone, // User fields
                vendorCode, name, type, billingAddress, // Vendor minimal required fields
                ...otherVendorFields
            } = body;

            // 1. Basic Validation
            if (!email || !password || !first_name || !vendorCode || !name || !type || !billingAddress) {
                return {
                    success: false,
                    message: "Missing required fields. Please provide user details (email, password, name) and vendor details (code, name, type, address).",
                    status: 400
                };
            }

            // 2. Check if user exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return {
                    success: false,
                    message: "User with this email already exists",
                    status: 409
                };
            }

            // 3. Create User
            // We use AuthModel logic or direct UserModel logic. AuthModel.register handles hashing.
            // But we need to set role to 'vendor'. AuthModel.register sets default 'customer'.
            // So we use UserModel.create directly after hashing password.

            const passwordHash = await PasswordUtil.hash(password);

            const userData = {
                first_name,
                last_name: last_name || '', // optional in user model? No, it says NOT NULL.
                email,
                password_hash: passwordHash,
                phone: phone || null,
                role: 'vendor' as const
            };

            const user = await UserModel.create(userData);

            if (!user) {
                return {
                    success: false,
                    message: "Failed to create user account for vendor",
                    status: 500
                };
            }

            // 4. Create Vendor Profile
            const vendorData: Partial<Vendor> = {
                user_id: user.id,
                vendorCode,
                name,
                type,
                email, // Business email same as user email by default
                phone: phone || '',
                billingAddress,
                ...otherVendorFields
            };

            const vendor = await VendorModel.create(vendorData);

            return {
                success: true,
                message: "Vendor added successfully",
                data: {
                    user: { id: user.id, email: user.email, role: user.role },
                    vendor
                },
                status: 201
            };

        } catch (error: any) {
            console.error("Add Vendor Error:", error);
            return {
                success: false,
                message: "Failed to add vendor",
                error: error.message,
                status: 500
            };
        }
    }

    /**
     * Delete Vendor (Deletes User and Vendor Profile)
     */
    static async deleteVendor(vendorId: number) {
        try {
            // Find vendor first to get user_id
            const vendor = await VendorModel.findById(vendorId);

            if (!vendor) {
                return {
                    success: false,
                    message: "Vendor not found",
                    status: 404
                };
            }

            // Delete User (Cascades to Vendor)
            const deleted = await UserModel.delete(vendor.user_id);

            if (!deleted) {
                // Fallback: try deleting vendor directly if user delete failed (e.g. user missing)
                await VendorModel.delete(vendorId);
            }

            return {
                success: true,
                message: "Vendor and associated user account deleted successfully",
                status: 200
            };
        } catch (error: any) {
            console.error("Delete Vendor Error:", error);
            return {
                success: false,
                message: "Failed to delete vendor",
                error: error.message,
                status: 500
            };
        }
    }

    /**
     * Get All Vendors
     */
    static async getAllVendors() {
        try {
            const vendors = await VendorModel.findAll();
            return {
                success: true,
                data: vendors,
                status: 200
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Failed to fetch vendors",
                error: error.message,
                status: 500
            }
        }
    }
}

