
import { db } from '../db/drizzle';
import { products } from '../db/schema_drizzle';
import { eq } from 'drizzle-orm';

async function checkSku() {
    console.log("Checking for product with SKU: wh-1");
    const existing = await db.select().from(products).where(eq(products.sku, 'wh-1'));

    if (existing.length > 0) {
        console.log("❌ FOUND DUPLICATE! A product already exists with this SKU:");
        console.log(JSON.stringify(existing[0], null, 2));
    } else {
        console.log("✅ SKU 'wh-1' is available.");
    }
    process.exit(0);
}

checkSku();
