import dotenv from "dotenv";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { userRoutes } from "./routes/user.routes";
import { authRoutes } from "./routes/auth.routes";
import { vendorRoutes } from "./routes/vendor.routes";
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

// CORS configuration - allow frontend to communicate with backend
const corsOrigin = process.env.CORS_ORIGIN || [
	"http://localhost:5173",    // Vite default dev port
	"http://localhost:3000",    // Fallback
	"http://localhost:5000",    // Alternative port
];

export const app = new Elysia()
	.use(cors({
		origin: corsOrigin,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}))
	.get("/", () => "🚀 Bun + Elysia + PostgreSQL with JWT Auth is running")
	.use(authRoutes)
	.use(userRoutes)
	.use(vendorRoutes)
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
