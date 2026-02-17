
import { Elysia } from "elysia";
import { VendorController } from "../controller/vendor.controller";
import { jwtMiddleware, requireVendorOrAdmin, type AuthContext } from "../middleware/jwt.middleware";

export const vendorRoutes = new Elysia({ prefix: "/api/vendor" })
    .onBeforeHandle(async (context) => {
        const authResult = await jwtMiddleware(context as unknown as AuthContext);
        if (authResult) return authResult;

        // Optional: specific check for vendor role?
        // requireVendorOrAdmin middleware checks role
        const roleResult = await requireVendorOrAdmin(context as unknown as AuthContext);
        if (roleResult) return roleResult;
    })
    .get("/profile", (context) => VendorController.getProfile(context as unknown as AuthContext))
    .post("/profile", (context) => VendorController.createProfile(context as unknown as AuthContext))
    .put("/profile", (context) => VendorController.updateProfile(context as unknown as AuthContext))
    .get("/orders", (context) => VendorController.getOrders(context as unknown as AuthContext))
    .get("/stats", (context) => VendorController.getStats(context as unknown as AuthContext));
