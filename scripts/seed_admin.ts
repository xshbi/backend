import { sql } from "../src/db/schema";
import { PasswordUtil } from "../src/models/user.model";

const seedAdmin = async () => {
    console.log("🌱 Seeding Admin User...");

    const email = "admin@example.com";
    const password = "admin123";
    const firstName = "Admin";
    const lastName = "User";

    try {
        const passwordHash = await PasswordUtil.hash(password);

        // Check if user exists
        const [existing] = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (existing) {
            console.log("Updating existing admin user...");
            await sql`
                UPDATE users 
                SET role = 'admin', password_hash = ${passwordHash}, first_name = ${firstName}, last_name = ${lastName}
                WHERE email = ${email}
            `;
        } else {
            console.log("Creating new admin user...");
            await sql`
                INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified, is_active)
                VALUES (${firstName}, ${lastName}, ${email}, ${passwordHash}, 'admin', true, true)
            `;
        }

        console.log(`✅ Admin user ready successfully!`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
    } finally {
        process.exit();
    }
};

seedAdmin();
