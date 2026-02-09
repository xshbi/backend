
import { sql } from "./schema";
import { createUsersTable, createAddressesTable, createWishlistTable, createCartTable } from "../models/user.model";
import { createCategoriesTable, createProductsTable, createProductImagesTable, createProductVariantsTable, createProductReviewsTable, createProductTagsTable } from "../models/product.model";
import { createSessionsTable, createOAuthAccountsTable, createLoginAttemptsTable, createPasswordResetTokensTable, createEmailVerificationTokensTable, createTwoFactorTable } from "../models/auth.model";
import { createVendorsTable } from "../models/vendor.model";

const initDb = async () => {
    console.log("🔄 Initializing database...");

    try {
        // Always drop tables to ensure clean state
        console.log("⚠️ Dropping tables...");
        // Independent tables (or those that depend on users/products)
        await sql`DROP TABLE IF EXISTS product_tags CASCADE`;
        await sql`DROP TABLE IF EXISTS tags CASCADE`;
        await sql`DROP TABLE IF EXISTS product_reviews CASCADE`;
        await sql`DROP TABLE IF EXISTS product_variants CASCADE`;
        await sql`DROP TABLE IF EXISTS product_images CASCADE`;
        await sql`DROP TABLE IF EXISTS products CASCADE`;
        await sql`DROP TABLE IF EXISTS categories CASCADE`;

        await sql`DROP TABLE IF EXISTS cart CASCADE`;
        await sql`DROP TABLE IF EXISTS wishlist CASCADE`;
        await sql`DROP TABLE IF EXISTS addresses CASCADE`;

        await sql`DROP TABLE IF EXISTS vendors CASCADE`;

        await sql`DROP TABLE IF EXISTS sessions CASCADE`;
        await sql`DROP TABLE IF EXISTS oauth_accounts CASCADE`;
        await sql`DROP TABLE IF EXISTS login_attempts CASCADE`;
        await sql`DROP TABLE IF EXISTS password_reset_tokens CASCADE`;
        await sql`DROP TABLE IF EXISTS email_verification_tokens CASCADE`;
        await sql`DROP TABLE IF EXISTS two_factor_auth CASCADE`;

        await sql`DROP TABLE IF EXISTS users CASCADE`;

        console.log("Creating tables...");

        // Users & Auth
        await createUsersTable();
        console.log("✅ Created Users");
        await createAddressesTable();
        console.log("✅ Created Addresses");

        await createVendorsTable();
        console.log("✅ Created Vendors");

        await createSessionsTable();
        console.log("✅ Created Sessions");

        await createOAuthAccountsTable();
        await createLoginAttemptsTable();
        await createPasswordResetTokensTable();
        await createEmailVerificationTokensTable();
        await createTwoFactorTable();

        // Products
        await createCategoriesTable();
        console.log("✅ Created Categories");

        await createProductsTable();
        console.log("✅ Created Products");

        // Debug: List tables
        const tables1 = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

        console.log("📊 Tables exist:", tables1.map(t => t.table_name).join(', '));

        await createProductImagesTable();
        await createProductVariantsTable();
        await createProductReviewsTable();
        await createTagsTable();

        // Dependent on Products & Users
        console.log("Creating Wishlist...");
        await createWishlistTable();
        console.log("✅ Created Wishlist");

        console.log("Creating Cart...");
        await createCartTable();
        console.log("✅ Created Cart");

        console.log("✅ Database initialized successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
        process.exit(1);
    }
};

// Start
initDb();

// Generic helper for tags
async function createTagsTable() {
    await createProductTagsTable();
}
