
import { createNotificationsTable } from '../models/notification.model';
import { sql } from '../db/schema';

console.log('Running notifications migration...');

const run = async () => {
    try {
        // Just force connection by querying something simple first, or just run function
        await sql`SELECT 1`;
        await createNotificationsTable();
        console.log('Notifications table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
