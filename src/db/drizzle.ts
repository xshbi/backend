import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema_drizzle';

// Ensure you have DATABASE_URL in your .env file
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
