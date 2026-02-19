/**
 * migrate_orders.ts
 *
 * Adds the full orders schema to an existing database WITHOUT dropping or
 * touching any other tables (users, products, cart, etc. are all preserved).
 *
 * Run with:
 *   bun src/scripts/migrate_orders.ts
 */

import 'dotenv/config';
import {
    createOrdersTable,
    createOrderItemsTable,
    createOrderStatusHistoryTable,
    createShipmentsTable,
    createReturnsTable,
    createReturnItemsTable,
    createCouponsTable,
    createCouponUsageTable,
} from '../models/order.model';
import { sql } from '../db/schema';

async function migrate() {
    console.log('🔄 Running orders migration...\n');

    try {
        // 1. orders  (depends on: users, addresses)
        await createOrdersTable();
        console.log('✅ orders');

        // 2. order_items  (depends on: orders, products, product_variants)
        await createOrderItemsTable();
        console.log('✅ order_items');

        // 3. order_status_history  (depends on: orders, users)
        await createOrderStatusHistoryTable();
        console.log('✅ order_status_history');

        // 4. shipments  (depends on: orders)
        await createShipmentsTable();
        console.log('✅ shipments');

        // 5. order_returns  (depends on: orders, users, addresses)
        await createReturnsTable();
        console.log('✅ order_returns');

        // 6. return_items  (depends on: order_returns, order_items)
        await createReturnItemsTable();
        console.log('✅ return_items');

        // 7. coupons  (standalone)
        await createCouponsTable();
        console.log('✅ coupons');

        // 8. coupon_usage  (depends on: coupons, users, orders)
        await createCouponUsageTable();
        console.log('✅ coupon_usage');

        // Show all tables now in the DB
        const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
        console.log(
            '\n📊 All tables in DB:\n  ' +
            tables.map((t: any) => t.table_name).join('\n  ')
        );

        console.log('\n🎉 Orders migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
