import { sql } from "../src/db/schema";

const unlockAccount = async () => {
    console.log("🔓 Unlocking admin account...");

    const email = "admin@example.com";

    try {
        // Clear recent failed login attempts
        const result = await sql`
            DELETE FROM login_attempts 
            WHERE email = ${email} 
            AND success = FALSE
        `;

        console.log(`✅ Cleared ${result.count} failed login attempts`);
        console.log(`🎉 Account unlocked successfully!`);
        console.log(`\nYou can now login with:`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: admin123`);
    } catch (error) {
        console.error("❌ Error unlocking account:", error);
    } finally {
        process.exit();
    }
};

unlockAccount();
