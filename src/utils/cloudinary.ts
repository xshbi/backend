
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param filePath - The path to the file or the file data (base64)
 * @param folder - Optional folder name in Cloudinary
 */
export const uploadToCloudinary = async (filePath: string, folder: string = 'ecommerce') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder
        });
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            data: result
        };
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            message: error.message || 'Failed to upload image',
            error
        };
    }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image
 */
export const deleteFromCloudinary = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: true,
            data: result
        };
    } catch (error: any) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            message: error.message || 'Failed to delete image',
            error
        };
    }
};

export default cloudinary;
