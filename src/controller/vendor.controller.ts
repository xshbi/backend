
import type { Context } from 'elysia';
import { VendorModel, type Vendor, VendorStatus, VendorType } from '../models/vendor.model';
import type { AuthContext } from '../middleware/auth.middleware';

export class VendorController {
    // Helper to map DB result (snake_case) to API response (camelCase)
    private static mapToResponse(vendor: any): Vendor {
        if (!vendor) return vendor;
        return {
            ...vendor,
            vendorCode: vendor.vendor_code,
            legalName: vendor.legal_name,
            billingAddress: vendor.billing_address,
            shippingAddress: vendor.shipping_address,
            contactPersons: vendor.contact_persons || [],
            paymentTerms: vendor.payment_terms,
            creditLimit: vendor.credit_limit,
            bankDetails: vendor.bank_details,
            taxInformation: vendor.tax_information,
            businessRegistrationNumber: vendor.business_registration_number,
            incorporationDate: vendor.incorporation_date,
            createdAt: vendor.created_at,
            updatedAt: vendor.updated_at,
            // Ensure we keep the original keys if they are already camelCase (just in case)
            // but the explicit mapping above handles the snake_case ones from DB
        };
    }

    /**
     * Get current vendor profile
     */
    static async getProfile(context: AuthContext) {
        try {
            const userId = context.user!.userId;
            const vendor = await VendorModel.findByUserId(userId);

            if (!vendor) {
                // If user is vendor but no profile exists, return null or empty object?
                // Returning 404 might be better for frontend handling
                context.set.status = 404;
                return {
                    success: false,
                    error: 'Profile not found',
                    message: 'Vendor profile does not exist for this user.'
                };
            }

            return {
                success: true,
                data: VendorController.mapToResponse(vendor)
            };
        } catch (error: any) {
            console.error('Get vendor profile error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Server error',
                message: error.message || 'Failed to fetch vendor profile'
            };
        }
    }

    /**
     * Create vendor profile
     */
    static async createProfile(context: AuthContext) {
        try {
            const body = context.body as Partial<Vendor>;
            const userId = context.user!.userId;

            // Check if profile already exists
            const existing = await VendorModel.findByUserId(userId);
            if (existing) {
                context.set.status = 409;
                return {
                    success: false,
                    error: 'Profile already exists',
                    message: 'Vendor profile already exists for this user.'
                };
            }

            // Ideally generate vendorCode automatically if not provided
            // For now, assume body has necessary fields or handle gracefully
            const vendorData = {
                ...body,
                user_id: userId,
                // Generate a simple unique vendor code if missing for now
                vendorCode: body.vendorCode || `VND-${Date.now().toString().slice(-6)}`,
                status: VendorStatus.ACTIVE,
                name: body.name || 'New Vendor',
                type: (body.type as VendorType) || VendorType.SUPPLIER,
                billingAddress: body.billingAddress || { street: '', city: '', state: '', postalCode: '', country: '' },
                contactPersons: body.contactPersons || []
            };

            const vendor = await VendorModel.create(vendorData);

            return {
                success: true,
                message: 'Vendor profile created successfully',
                data: VendorController.mapToResponse(vendor)
            };
        } catch (error: any) {
            console.error('Create vendor profile error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Creation failed',
                message: error.message || 'Failed to create vendor profile'
            };
        }
    }

    /**
     * Update vendor profile
     */
    static async updateProfile(context: AuthContext) {
        try {
            const body = context.body as Partial<Vendor>;
            const userId = context.user!.userId;

            // Ensure profile exists
            const existing = await VendorModel.findByUserId(userId);
            if (!existing) {
                context.set.status = 404;
                return {
                    success: false,
                    error: 'Profile not found',
                    message: 'Vendor profile does not exist. Please create one first.'
                };
            }

            // Remove immutable fields if any
            // const { id, user_id, vendorCode, ...updates } = body; 
            // In SQL helper, we can pass partials, but safer to strip unwanted fields here if needed.
            // For simplicity, passing body.

            const updatedVendor = await VendorModel.update(userId, body);

            if (!updatedVendor) {
                // If update returns null, it means no rows updated (or nothing to update)
                // Since we checked existence, it probably means sent body was empty or error.
                // But for now assume success if existing was found.
                // Or refetch.
                return {
                    success: false,
                    message: "No changes made or update failed"
                }
            }

            return {
                success: true,
                message: 'Vendor profile updated successfully',
                data: VendorController.mapToResponse(updatedVendor)
            };
        } catch (error: any) {
            console.error('Update vendor profile error:', error);
            context.set.status = 500;
            return {
                success: false,
                error: 'Update failed',
                message: error.message || 'Failed to update vendor profile'
            };
        }
    }
    /**
     * Get vendor orders
     */
    static async getOrders(context: AuthContext) {
        try {
            const userId = context.user!.userId;
            const vendor = await VendorModel.findByUserId(userId);

            if (!vendor) {
                context.set.status = 404;
                return { success: false, message: 'Vendor profile not found' };
            }

            const query = context.query as any;
            const limit = query.limit ? parseInt(query.limit) : 20;
            const offset = query.offset ? parseInt(query.offset) : 0;

            const orders = await import('../models/order.model').then(m => m.OrderModel.getVendorOrders(vendor.id, limit, offset));

            return {
                success: true,
                data: orders
            };
        } catch (error: any) {
            console.error('Get vendor orders error:', error);
            context.set.status = 500;
            return {
                success: false,
                message: 'Failed to fetch vendor orders',
                error: error.message
            };
        }
    }

    /**
     * Get vendor statistics
     */
    static async getStats(context: AuthContext) {
        try {
            const userId = context.user!.userId;
            const vendor = await VendorModel.findByUserId(userId);

            if (!vendor) {
                context.set.status = 404;
                return { success: false, message: 'Vendor profile not found' };
            }

            const stats = await import('../models/order.model').then(m => m.OrderModel.getVendorStats(vendor.id));

            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            console.error('Get vendor stats error:', error);
            context.set.status = 500;
            return {
                success: false,
                message: 'Failed to fetch vendor statistics',
                error: error.message
            };
        }
    }
}
