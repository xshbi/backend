import { Elysia } from "elysia";
import { AdminController } from "../controller/admin.controller";
import { jwtMiddleware, requireVendorOrAdmin, type AuthContext } from "../middleware/jwt.middleware";

export const adminProductRoutes = new Elysia({ prefix: "/api/admin-products" })
    // Middleware to ensure user is authenticated and is an admin or vendor
    .onBeforeHandle(async (context) => {
        const authResult = await jwtMiddleware(context as unknown as AuthContext);
        if (authResult) return authResult;

        const roleResult = await requireVendorOrAdmin(context as unknown as AuthContext);
        if (roleResult) return roleResult;
    })

    /**
     * @route POST /api/admin-products
     * @desc Create a new product (Admin or Vendor)
     */
    .post("/", async (context) => {
        const { body } = context;
        const authContext = context as unknown as AuthContext;
        const userId = authContext.user?.userId || 0;
        return await AdminController.createProduct(body, userId);
    })

    /**
     * @route PATCH /api/admin-products/:id/stock
     * @desc Update product stock (Add/Reduce/Set) (Admin or Vendor)
     * Body: { quantity: number, type: 'add' | 'reduce' | 'set' }
     */
    .patch("/:id/stock", async (context) => {
        const { body, params } = context;
        const id = parseInt(params.id);
        return await AdminController.updateStock(body, id);
    })

    /**
     * @route DELETE /api/admin-products/:id
     * @desc Delete a product (Admin or Vendor)
     */
    .delete("/:id", async (context) => {
        const { params } = context;
        const id = parseInt(params.id);
        return await AdminController.deleteProduct(id);
    });
