import { sql } from "./schema";
import { createUsersTable, createAddressesTable, createWishlistTable, createCartTable } from "../models/user.model";
import { createCategoriesTable, createProductsTable, createProductImagesTable, createProductVariantsTable, createProductReviewsTable, createProductTagsTable } from "../models/product.model";
import { createSessionsTable, createOAuthAccountsTable, createLoginAttemptsTable, createPasswordResetTokensTable, createEmailVerificationTokensTable, createTwoFactorTable } from "../models/auth.model";
import { createVendorsTable } from "../models/vendor.model";
import {
    createOrdersTable,
    createOrderItemsTable,
    createOrderStatusHistoryTable,
    createShipmentsTable,
    createReturnsTable,
    createReturnItemsTable,

    createCouponsTable,
    createCouponUsageTable,
} from "../models/order.model";
import { createNotificationsTable } from "../models/notification.model";

const initDb = async () => {
    console.log("🔄 Initializing database...");

    try {
        // ── Drop all tables (dependency order: children first) ──────────────
        console.log("⚠️ Dropping tables...");

        // Order-related (must drop before orders)
        await sql`DROP TABLE IF EXISTS coupon_usage CASCADE`;
        await sql`DROP TABLE IF EXISTS coupons CASCADE`;
        await sql`DROP TABLE IF EXISTS return_items CASCADE`;
        await sql`DROP TABLE IF EXISTS order_returns CASCADE`;
        await sql`DROP TABLE IF EXISTS shipments CASCADE`;
        await sql`DROP TABLE IF EXISTS order_status_history CASCADE`;
        await sql`DROP TABLE IF EXISTS order_items CASCADE`;
        await sql`DROP TABLE IF EXISTS orders CASCADE`;

        // Product-related
        await sql`DROP TABLE IF EXISTS product_tags CASCADE`;
        await sql`DROP TABLE IF EXISTS tags CASCADE`;
        await sql`DROP TABLE IF EXISTS product_reviews CASCADE`;
        await sql`DROP TABLE IF EXISTS product_variants CASCADE`;
        await sql`DROP TABLE IF EXISTS product_images CASCADE`;
        await sql`DROP TABLE IF EXISTS products CASCADE`;
        await sql`DROP TABLE IF EXISTS categories CASCADE`;

        // User-related
        await sql`DROP TABLE IF EXISTS cart CASCADE`;
        await sql`DROP TABLE IF EXISTS wishlist CASCADE`;
        await sql`DROP TABLE IF EXISTS addresses CASCADE`;
        await sql`DROP TABLE IF EXISTS vendors CASCADE`;

        // Auth-related
        await sql`DROP TABLE IF EXISTS sessions CASCADE`;
        await sql`DROP TABLE IF EXISTS oauth_accounts CASCADE`;
        await sql`DROP TABLE IF EXISTS login_attempts CASCADE`;
        await sql`DROP TABLE IF EXISTS password_reset_tokens CASCADE`;
        await sql`DROP TABLE IF EXISTS email_verification_tokens CASCADE`;
        await sql`DROP TABLE IF EXISTS two_factor_auth CASCADE`;

        await sql`DROP TABLE IF EXISTS notifications CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;

        // ── Create all tables (dependency order: parents first) ──────────────
        console.log("Creating tables...");

        // Core: Users & Auth
        await createUsersTable();
        console.log("✅ Users");
        await createNotificationsTable();
        console.log("✅ Notifications");
        await createAddressesTable();
        console.log("✅ Addresses");
        await createVendorsTable();
        console.log("✅ Vendors");
        await createSessionsTable();
        console.log("✅ Sessions");
        await createOAuthAccountsTable();
        await createLoginAttemptsTable();
        await createPasswordResetTokensTable();
        await createEmailVerificationTokensTable();
        await createTwoFactorTable();
        console.log("✅ Auth tables");

        // Products
        await createCategoriesTable();
        console.log("✅ Categories");
        await createProductsTable();
        console.log("✅ Products");
        await createProductImagesTable();
        await createProductVariantsTable();
        await createProductReviewsTable();
        await createProductTagsTable();
        console.log("✅ Product sub-tables");

        // User-owned
        await createWishlistTable();
        console.log("✅ Wishlist");
        await createCartTable();
        console.log("✅ Cart");

        // Orders (depend on users, addresses, products)
        await createOrdersTable();
        console.log("✅ Orders");
        await createOrderItemsTable();
        console.log("✅ Order Items");
        await createOrderStatusHistoryTable();
        console.log("✅ Order Status History");
        await createShipmentsTable();
        console.log("✅ Shipments");
        await createReturnsTable();
        console.log("✅ Returns");
        await createReturnItemsTable();
        console.log("✅ Return Items");
        await createCouponsTable();
        console.log("✅ Coupons");
        await createCouponUsageTable();
        console.log("✅ Coupon Usage");

        // Confirm
        const tables = await sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        console.log("📊 Tables:", tables.map((t: any) => t.table_name).join(', '));
        console.log("✅ Database initialized successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
        process.exit(1);
    }
};

initDb();
