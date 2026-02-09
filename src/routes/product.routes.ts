import { Elysia } from "elysia";
import { ProductController } from "../controller/product.controller";
import { jwtMiddleware, requireAdmin, requireVendorOrAdmin, type AuthContext } from "../middleware/jwt.middleware";

export const productRoutes = new Elysia({ prefix: "/api/products" })
    // Public routes - No authentication required

    /**
     * @route GET /api/products
     * @desc Get all products with optional filters
     * @access Public
     */
    .get("/", async ({ query }) => {
        const result = await ProductController.getAllProducts(query);
        return {
            ...result,
        };
    })

    /**
     * @route GET /api/products/:id
     * @desc Get product by ID
     * @access Public
     */
    .get("/:id", async ({ params }) => {
        const id = parseInt(params.id);
        const result = await ProductController.getProductById(id);
        return {
            ...result,
        };
    })

    /**
     * @route GET /api/products/slug/:slug
     * @desc Get product by slug
     * @access Public
     */
    .get("/slug/:slug", async ({ params }) => {
        const result = await ProductController.getProductBySlug(params.slug);
        return {
            ...result,
        };
    })

    /**
     * @route GET /api/products/:id/reviews
     * @desc Get product reviews
     * @access Public
     */
    .get("/:id/reviews", async ({ params }) => {
        const id = parseInt(params.id);
        const result = await ProductController.getProductReviews(id);
        return {
            ...result,
        };
    })

    /**
     * @route GET /api/products/:id/related
     * @desc Get related products
     * @access Public
     */
    .get("/:id/related", async ({ params, query }) => {
        const id = parseInt(params.id);
        const result = await ProductController.getRelatedProducts(id, query);
        return {
            ...result,
        };
    })

    // Protected routes - Authentication required

    /**
     * @route POST /api/products
     * @desc Create a new product (Add Product)
     * @access Private (Vendor or Admin)
     */
    .post(
        "/",
        async (context) => {
            const { body } = context;
            const authContext = context as unknown as AuthContext;

            // Auto-assign vendor_id if user is a vendor
            if (authContext.user?.role === 'vendor') {
                (body as any).vendor_id = authContext.user.userId;
            }

            const result = await ProductController.createProduct(body);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireVendorOrAdmin],
        }
    )

    /**
     * @route PUT /api/products/:id
     * @desc Update product
     * @access Private (Vendor or Admin)
     */
    .put(
        "/:id",
        async ({ params, body }) => {
            const id = parseInt(params.id);
            const result = await ProductController.updateProduct(id, body);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireVendorOrAdmin],
        }
    )

    /**
     * @route DELETE /api/products/:id
     * @desc Delete product (Remove Product)
     * @access Private (Vendor or Admin)
     */
    .delete(
        "/:id",
        async ({ params }) => {
            const id = parseInt(params.id);
            const result = await ProductController.deleteProduct(id);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireVendorOrAdmin],
        }
    )

    /**
     * @route PATCH /api/products/:id/stock
     * @desc Update product stock
     * @access Private (Vendor or Admin)
     */
    .patch(
        "/:id/stock",
        async ({ params, body }) => {
            const id = parseInt(params.id);
            const result = await ProductController.updateStock(id, body);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireVendorOrAdmin],
        }
    )

    /**
     * @route POST /api/products/:id/images
     * @desc Add product image
     * @access Private (Vendor or Admin)
     */
    .post(
        "/:id/images",
        async ({ params, body }) => {
            const id = parseInt(params.id);
            const result = await ProductController.addProductImage(id, body);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireVendorOrAdmin],
        }
    )

    /**
     * @route POST /api/products/:id/reviews
     * @desc Add product review
     * @access Private (Requires JWT)
     */
    .post(
        "/:id/reviews",
        async (context) => {
            const { params, body } = context;
            const authContext = context as unknown as AuthContext;
            const id = parseInt(params.id);
            const userId = authContext.user?.userId || 0; // Get user ID from JWT middleware
            const result = await ProductController.addProductReview(id, body, userId);
            return {
                ...result,
            };
        },
        {
            beforeHandle: jwtMiddleware,
        }
    );

// Category routes
export const categoryRoutes = new Elysia({ prefix: "/api/categories" })
    /**
     * @route GET /api/categories
     * @desc Get all categories
     * @access Public
     */
    .get("/", async () => {
        const result = await ProductController.getAllCategories();
        return {
            ...result,
        };
    })

    /**
     * @route POST /api/categories
     * @desc Create a new category
     * @access Private (Requires JWT)
     */
    .post(
        "/",
        async ({ body }) => {
            const result = await ProductController.createCategory(body);
            return {
                ...result,
            };
        },
        {
            beforeHandle: [jwtMiddleware, requireAdmin],
        }
    );
