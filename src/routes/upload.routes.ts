
import { Elysia, t } from 'elysia';
import { uploadToCloudinary } from '../utils/cloudinary';
import { jwtMiddleware } from '../middleware/jwt.middleware';

export const uploadRoutes = new Elysia({ prefix: '/api/upload' })
    /**
     * @route POST /api/upload
     * @desc Upload an image to Cloudinary
     * @access Private
     */
    .post('/', async ({ body, set }) => {
        const file = body.file;

        if (!file) {
            set.status = 400;
            return {
                success: false,
                message: "No file uploaded"
            };
        }

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            set.status = 400;
            return {
                success: false,
                message: "File must be an image"
            };
        }

        try {
            // Convert file to base64 or temp path for upload
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

            const result = await uploadToCloudinary(base64Image, 'ecommerce_products');

            if (result.success) {
                return {
                    success: true,
                    url: result.url,
                    public_id: result.public_id,
                    message: "Image uploaded successfully"
                };
            } else {
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to upload image to Cloudinary",
                    error: result.error
                };
            }
        } catch (error: any) {
            set.status = 500;
            return {
                success: false,
                message: "Server error during upload",
                error: error.message
            };
        }
    }, {
        body: t.Object({
            file: t.File()
        }),
        beforeHandle: [jwtMiddleware]
    });
