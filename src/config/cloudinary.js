import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

/**
 * Cloudinary Configuration
 * For file uploads (images, documents, etc.)
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Verify Cloudinary connection
 */
export const verifyCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    logger.info('✓ Cloudinary connected successfully');
    return true;
  } catch (error) {
    logger.error('✗ Cloudinary connection failed:', error.message);
    return false;
  }
};

export default cloudinary;
