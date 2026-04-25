import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

/**
 * Cloudinary Configuration
 * For file uploads (images, documents, etc.)
 */

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Only configure if credentials are available
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Verify Cloudinary connection
 */
export const verifyCloudinaryConnection = async () => {
  try {
    // Check if credentials are provided
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.warn('⚠️  Cloudinary credentials not configured. File upload will not work.');
      return false;
    }

    await cloudinary.api.ping();
    logger.info('✓ Cloudinary connected successfully');
    return true;
  } catch (error) {
    logger.error('✗ Cloudinary connection failed:', error.message || error);
    logger.warn('⚠️  File upload features will not work until Cloudinary is configured.');
    return false;
  }
};

export default cloudinary;
