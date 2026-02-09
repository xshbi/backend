import { Elysia } from "elysia";
import { db } from "../db/db";

export const userRoutes = new Elysia()
  .get("/health", async () => {
    try {
      await db.query("SELECT 1");
      return {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  })
  .get("/users", async () => {
    try {
      const result = await db.query("SELECT * FROM users");
      return {
        success: true,
        count: result.rows.length,
        data: result.rows,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Make sure PostgreSQL is running and the 'users' table exists",
      };
    }
  });
