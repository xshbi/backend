
import { Elysia } from "elysia";
import { AdminController } from "../controller/admin.controller";
import { jwtMiddleware, requireAdmin, type AuthContext } from "../middleware/jwt.middleware";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
    .onBeforeHandle(async (context) => {
        const result = await jwtMiddleware(context as unknown as AuthContext);
        if (result) return result;
    })
    .onBeforeHandle(async (context) => {
        return await requireAdmin(context as unknown as AuthContext);
    })

    /**
     * @route POST /api/admin/products
     * @desc Create a new product
     */
    .post("/products", async (context) => {
        const { body } = context;
        const authContext = context as unknown as AuthContext;
        const userId = authContext.user?.userId || 0;

        return await AdminController.createProduct(body, userId);
    })

    /**
     * @route DELETE /api/admin/products/:id
     * @desc Delete a product
     */
    .delete("/products/:id", async ({ params }) => {
        const id = parseInt(params.id);
        return await AdminController.deleteProduct(id);
    })

    /**
     * @route GET /api/admin/products
     * @desc Get all products
     */
    .get("/products", async () => {
        return await AdminController.getAllProducts();
    })

    /**
     * @route POST /api/admin/products/:id/flag
     * @desc Flag a product
     */
    .post("/products/:id/flag", async ({ params, body }) => {
        const id = parseInt(params.id);
        return await AdminController.flagProduct(id, body);
    })

    /**
     * @route POST /api/admin/vendors
     * @desc Add a new vendor (User + Profile)
     */
    .post("/vendors", async ({ body }) => {
        return await AdminController.addVendor(body);
    })

    /**
     * @route DELETE /api/admin/vendors/:id
     * @desc Delete a vendor
     */
    .delete("/vendors/:id", async ({ params }) => {
        const id = parseInt(params.id);
        return await AdminController.deleteVendor(id);
    })

    /**
     * @route GET /api/admin/vendors
     * @desc Get all vendors
     */
    .get("/vendors", async () => {
        return await AdminController.getAllVendors();
    });

