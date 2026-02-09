
import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../index";

const BASE_URL = "http://127.0.0.1:8000";

// Mock user for testing
const testUser = {
    email: "test_vendor@example.com",
    password: "password123",
    first_name: "Test",
    last_name: "Vendor",
    role: "vendor"
};

let authToken = "";
let createdProductId = 0;

console.log("🚀 Starting Product Add/Remove Demo...");

async function runDemo() {
    try {
        // 1. Register/Login to get a token
        console.log("\n1. Authenticating...");

        // Try login first
        console.log(`   Attempting login to ${BASE_URL}/auth/login`);
        let loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        console.log(`   Login Status: ${loginRes.status}`);

        if (loginRes.status !== 200) {
            // If login fails, try registering
            console.log("   Login failed, trying to register...");
            const registerRes = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testUser)
            });

            console.log(`   Register Status: ${registerRes.status}`);

            if (registerRes.status === 201) {
                console.log("   Registration successful!");
                // Login again after registration
                loginRes = await fetch(`${BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: testUser.email,
                        password: testUser.password
                    })
                });
            } else {
                const regText = await registerRes.text();
                // If 409, it means user already exists (maybe created in previous partial run), so we proceed to login logic which handles flow
                if (registerRes.status === 409) {
                    console.log("   User already registered, retrying login...");
                    loginRes = await fetch(`${BASE_URL}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: testUser.email,
                            password: testUser.password
                        })
                    });
                } else {
                    console.error("❌ Registration failed Body:", regText);
                }
            }
        }

        let loginData: any;
        try {
            loginData = await loginRes.json();
        } catch (e) {
            console.error("❌ Failed to parse login response JSON");
            console.error("Status:", loginRes.status);
            return;
        }

        if (!loginData.success) {
            console.error("❌ Authentication failed:", loginData);
            return;
        }

        authToken = loginData.accessToken || loginData.data?.accessToken || loginData.token || loginData.data?.token;
        if (!authToken) {
            console.error("❌ Token not found in login response:", loginData);
            return;
        }
        console.log("✅ Authenticated. Token received.");

        // 2. Add a Category (Required for product)
        console.log("\n2. Creating a Category...");
        const categoryRes = await fetch(`${BASE_URL}/api/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: "Electronics Demo " + Date.now(),
                slug: "electronics-demo-" + Date.now(),
                description: "Demo category"
            })
        });

        const categoryData = await categoryRes.json() as any;
        const categoryId = categoryData.data?.id;

        if (categoryData.success) {
            console.log(`✅ Category created: ${categoryData.data.name} (ID: ${categoryId})`);
        } else {
            console.log("⚠️ Failed to create category (might already exist):", categoryData.message);
        }

        // 3. Add a Product
        console.log("\n3. Adding a new Product...");
        const newProduct = {
            name: "Test Smartphone " + Date.now(),
            slug: "test-smartphone-" + Date.now(),
            sku: "PHONE-" + Date.now(),
            price: 999.99,
            description: "A high-end test smartphone",
            category_id: categoryId,
            stock_quantity: 50
        };

        const addProductRes = await fetch(`${BASE_URL}/api/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(newProduct)
        });

        const productData = await addProductRes.json() as any;

        if (productData.success) {
            createdProductId = productData.data.id;
            console.log(`✅ Product added successfully!`);
            console.log(`   ID: ${createdProductId}`);
            console.log(`   Name: ${productData.data.name}`);
            console.log(`   Price: $${productData.data.price}`);
        } else {
            console.error("❌ Failed to add product:", productData);
            return;
        }

        // 4. Verify Product was added
        console.log("\n4. Verifying Product existence...");
        const getProductRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
        const getProductData = await getProductRes.json() as any;

        if (getProductData.success) {
            console.log("✅ Product confirmed in database.");
        } else {
            console.error("❌ Could not create product (Get request failed).");
        }

        // 5. Remove the Product
        console.log("\n5. Removing the Product...");
        const deleteRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });

        const deleteData = await deleteRes.json() as any;

        if (deleteData.success) {
            console.log("✅ Product removed successfully.");
        } else {
            console.error("❌ Failed to remove product:", deleteData);
        }

        // 6. Verify Removal
        console.log("\n6. Verifying Removal...");
        const verifyRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);

        if (verifyRes.status === 404) {
            console.log("✅ Product not found (as expected).");
        } else {
            const verifyData = await verifyRes.json() as any;
            if (!verifyData.success) {
                console.log("✅ Product not found (API returned success: false).");
            } else {
                console.log("⚠️ Product still exists:", verifyData);
            }
        }

        console.log("\n✨ Demo Completed!");
    } catch (error) {
        console.error("🚨 Unhandled error in demo script:", error);
    }
}

// Check if anyone is listening, otherwise this is just a module
if (import.meta.main) {
    runDemo();
}
