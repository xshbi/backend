import { ProductModel, CategoryModel } from "../models/product.model";

export class ProductController {
    /**
     * Create a new product
     */
    static async createProduct(body: any) {
        try {
            const {
                name,
                slug,
                sku,
                price,
                description,
                short_description,
                category_id,
                stock_quantity,
                brand,
                compare_price,
                cost_price,
                weight,
                weight_unit,
                dimensions,
                is_featured,
                meta_title,
                meta_description,
                meta_keywords,
                vendor_id,
            } = body;

            // Validate required fields
            if (!name || !slug || !sku || price === undefined) {
                return {
                    success: false,
                    message: "Missing required fields: name, slug, sku, and price are required",
                    status: 400,
                };
            }

            // Validate price
            if (price < 0) {
                return {
                    success: false,
                    message: "Price must be a positive number",
                    status: 400,
                };
            }

            // Create product data object
            const productData: any = {
                name,
                slug,
                sku,
                price,
            };

            // Add optional fields if provided
            if (description) productData.description = description;
            if (short_description) productData.short_description = short_description;
            if (category_id) productData.category_id = category_id;
            if (stock_quantity !== undefined) productData.stock_quantity = stock_quantity;
            if (brand) productData.brand = brand;
            if (compare_price) productData.compare_price = compare_price;
            if (cost_price) productData.cost_price = cost_price;
            if (weight) productData.weight = weight;
            if (weight_unit) productData.weight_unit = weight_unit;
            if (dimensions) productData.dimensions = dimensions;
            if (is_featured !== undefined) productData.is_featured = is_featured;
            if (meta_title) productData.meta_title = meta_title;
            if (meta_description) productData.meta_description = meta_description;
            if (meta_keywords) productData.meta_keywords = meta_keywords;
            if (vendor_id) productData.vendor_id = vendor_id;

            // Create the product
            const product = await ProductModel.create(productData);

            return {
                success: true,
                message: "Product created successfully",
                data: product,
                status: 201,
            };
        } catch (error: any) {
            console.error("Error creating product:", error);

            // Handle unique constraint violations
            if (error.code === "23505") {
                return {
                    success: false,
                    message: "Product with this SKU or slug already exists",
                    status: 409,
                };
            }

            return {
                success: false,
                message: "Failed to create product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get all products with filters
     */
    static async getAllProducts(query: any) {
        try {
            const {
                category_id,
                brand,
                min_price,
                max_price,
                is_featured,
                search,
                vendor_id,
                limit,
                offset,
                sort_by,
                sort_order,
            } = query;

            const filters: any = {};

            if (category_id) filters.category_id = parseInt(category_id);
            if (brand) filters.brand = brand;
            if (min_price) filters.min_price = parseFloat(min_price);
            if (max_price) filters.max_price = parseFloat(max_price);
            if (is_featured !== undefined) filters.is_featured = is_featured === "true";
            if (search) filters.search = search;
            if (vendor_id) filters.vendor_id = parseInt(vendor_id);
            if (limit) filters.limit = parseInt(limit);
            if (offset) filters.offset = parseInt(offset);
            if (sort_by) filters.sort_by = sort_by;
            if (sort_order) filters.sort_order = sort_order;

            const products = await ProductModel.findAll(filters);

            return {
                success: true,
                data: products,
                count: products.length,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching products:", error);
            return {
                success: false,
                message: "Failed to fetch products",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get product by ID
     */
    static async getProductById(id: number) {
        try {
            const product = await ProductModel.findById(id);

            if (!product) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            return {
                success: true,
                data: product,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching product:", error);
            return {
                success: false,
                message: "Failed to fetch product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get product by slug
     */
    static async getProductBySlug(slug: string) {
        try {
            const product = await ProductModel.findBySlug(slug);

            if (!product) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            return {
                success: true,
                data: product,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching product:", error);
            return {
                success: false,
                message: "Failed to fetch product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Update product
     */
    static async updateProduct(id: number, body: any) {
        try {
            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            // Validate price if provided
            if (body.price !== undefined && body.price < 0) {
                return {
                    success: false,
                    message: "Price must be a positive number",
                    status: 400,
                };
            }

            // Update the product
            const updatedProduct = await ProductModel.update(id, body);

            return {
                success: true,
                message: "Product updated successfully",
                data: updatedProduct,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error updating product:", error);

            // Handle unique constraint violations
            if (error.code === "23505") {
                return {
                    success: false,
                    message: "Product with this SKU or slug already exists",
                    status: 409,
                };
            }

            return {
                success: false,
                message: "Failed to update product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Delete product (Remove product)
     */
    static async deleteProduct(id: number) {
        try {
            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            // Delete the product
            const deleted = await ProductModel.delete(id);

            if (!deleted) {
                return {
                    success: false,
                    message: "Failed to delete product",
                    status: 500,
                };
            }

            return {
                success: true,
                message: "Product deleted successfully",
                status: 200,
            };
        } catch (error: any) {
            console.error("Error deleting product:", error);
            return {
                success: false,
                message: "Failed to delete product",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Update product stock
     */
    static async updateStock(id: number, body: any) {
        try {
            const { quantity } = body;

            if (quantity === undefined) {
                return {
                    success: false,
                    message: "Quantity is required",
                    status: 400,
                };
            }

            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            await ProductModel.updateStock(id, quantity);

            // Get updated product
            const updatedProduct = await ProductModel.findById(id);

            return {
                success: true,
                message: "Stock updated successfully",
                data: updatedProduct,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error updating stock:", error);
            return {
                success: false,
                message: "Failed to update stock",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Add product image
     */
    static async addProductImage(id: number, body: any) {
        try {
            const { url, public_id, alt_text, is_primary, sort_order } = body;

            if (!url) {
                return {
                    success: false,
                    message: "Image URL is required",
                    status: 400,
                };
            }

            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            const imageData: any = {
                product_id: id,
                url,
            };

            if (public_id) imageData.public_id = public_id;
            if (alt_text) imageData.alt_text = alt_text;
            if (is_primary !== undefined) imageData.is_primary = is_primary;
            if (sort_order !== undefined) imageData.sort_order = sort_order;

            const image = await ProductModel.addImage(imageData);

            return {
                success: true,
                message: "Product image added successfully",
                data: image,
                status: 201,
            };
        } catch (error: any) {
            console.error("Error adding product image:", error);
            return {
                success: false,
                message: "Failed to add product image",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get product reviews
     */
    static async getProductReviews(id: number) {
        try {
            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            const reviews = await ProductModel.getProductReviews(id);
            const rating = await ProductModel.getAverageRating(id);

            return {
                success: true,
                data: {
                    reviews,
                    average_rating: rating.average,
                    review_count: rating.count,
                },
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching reviews:", error);
            return {
                success: false,
                message: "Failed to fetch reviews",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Add product review
     */
    static async addProductReview(id: number, body: any, userId: number) {
        try {
            const { rating, title, comment, is_verified_purchase } = body;

            if (!rating || rating < 1 || rating > 5) {
                return {
                    success: false,
                    message: "Rating must be between 1 and 5",
                    status: 400,
                };
            }

            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            const reviewData: any = {
                product_id: id,
                user_id: userId,
                rating,
            };

            if (title) reviewData.title = title;
            if (comment) reviewData.comment = comment;
            if (is_verified_purchase !== undefined)
                reviewData.is_verified_purchase = is_verified_purchase;

            const review = await ProductModel.addReview(reviewData);

            return {
                success: true,
                message: "Review added successfully",
                data: review,
                status: 201,
            };
        } catch (error: any) {
            console.error("Error adding review:", error);

            // Handle duplicate review
            if (error.code === "23505") {
                return {
                    success: false,
                    message: "You have already reviewed this product",
                    status: 409,
                };
            }

            return {
                success: false,
                message: "Failed to add review",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get related products
     */
    static async getRelatedProducts(id: number, query: any) {
        try {
            const limit = query.limit ? parseInt(query.limit) : 4;

            // Check if product exists
            const existingProduct = await ProductModel.findById(id);
            if (!existingProduct) {
                return {
                    success: false,
                    message: "Product not found",
                    status: 404,
                };
            }

            const relatedProducts = await ProductModel.getRelatedProducts(id, limit);

            return {
                success: true,
                data: relatedProducts,
                count: relatedProducts.length,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching related products:", error);
            return {
                success: false,
                message: "Failed to fetch related products",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Get all categories
     */
    static async getAllCategories() {
        try {
            const categories = await CategoryModel.getWithProductCount();

            return {
                success: true,
                data: categories,
                count: categories.length,
                status: 200,
            };
        } catch (error: any) {
            console.error("Error fetching categories:", error);
            return {
                success: false,
                message: "Failed to fetch categories",
                error: error.message,
                status: 500,
            };
        }
    }

    /**
     * Create category
     */
    static async createCategory(body: any) {
        try {
            const { name, slug, description, parent_id, image_url } = body;

            if (!name || !slug) {
                return {
                    success: false,
                    message: "Name and slug are required",
                    status: 400,
                };
            }

            const categoryData: any = {
                name,
                slug,
            };

            if (description) categoryData.description = description;
            if (parent_id) categoryData.parent_id = parent_id;
            if (image_url) categoryData.image_url = image_url;

            const category = await CategoryModel.create(categoryData);

            return {
                success: true,
                message: "Category created successfully",
                data: category,
                status: 201,
            };
        } catch (error: any) {
            console.error("Error creating category:", error);

            // Handle unique constraint violations
            if (error.code === "23505") {
                return {
                    success: false,
                    message: "Category with this name or slug already exists",
                    status: 409,
                };
            }

            return {
                success: false,
                message: "Failed to create category",
                error: error.message,
                status: 500,
            };
        }
    }
}
