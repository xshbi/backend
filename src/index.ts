import dotenv from "dotenv";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { userRoutes } from "./routes/user.routes";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes, categoryRoutes } from "./routes/product.routes";
import { adminRoutes } from "./routes/admin.routes";
import { adminProductRoutes } from "./routes/admin.product.routes";
import { adminOrderRoutes } from "./routes/admin.order.routes";
import { cartRoutes } from "./routes/cart.routes";
import { addressRoutes } from "./routes/address.routes";
import { orderRoutes } from "./routes/order.routes";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

export const app = new Elysia()
	.use(cors({
		origin: true, // Allow all origins in development
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	}))
	.get("/", () => "🚀 Bun + Elysia + PostgreSQL with JWT Auth is running")
	.use(authRoutes)
	.use(userRoutes)
	.use(productRoutes)
	.use(categoryRoutes)
	.use(adminRoutes)
	.use(adminProductRoutes)
	.use(adminOrderRoutes)
	.use(cartRoutes)
	.use(addressRoutes)
	.use(orderRoutes)
	.listen(PORT);

console.log(`🔥 Server running at http://localhost:${PORT}`);
