import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Upload Service using Cloudinary
 * Handles file uploads for profile images, documents, etc.
 */

const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload image to Cloudinary
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional upload options
 */
export const uploadImage = async (fileBuffer, folder = 'general', options = {}) => {
  try {
    const uploadOptions = {
      folder: `${process.env.CLOUDINARY_FOLDER || 'doctor-appointment'}/${folder}`,
      resource_type: 'image',
      allowed_formats: ALLOWED_IMAGE_FORMATS,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      ...options,
    };

    const result = await cloudinary.uploader.upload(fileBuffer, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
    };
  } catch (error) {
    logger.error('Image upload failed:', error);
    throw new AppError('Failed to upload image. Please try again.', 500);
  }
};

/**
 * Upload document to Cloudinary
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {string} folder - Cloudinary folder name
 */
export const uploadDocument = async (fileBuffer, folder = 'documents', options = {}) => {
  try {
    const uploadOptions = {
      folder: `${process.env.CLOUDINARY_FOLDER || 'doctor-appointment'}/${folder}`,
      resource_type: 'raw',
      allowed_formats: ALLOWED_DOCUMENT_FORMATS,
      ...options,
    };

    const result = await cloudinary.uploader.upload(fileBuffer, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.error('Document upload failed:', error);
    throw new AppError('Failed to upload document. Please try again.', 500);
  }
};

/**
 * Upload profile image with specific transformations
 */
export const uploadProfileImage = async (fileBuffer) => {
  return uploadImage(fileBuffer, 'profiles', {
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload doctor verification document
 */
export const uploadVerificationDocument = async (fileBuffer) => {
  return uploadDocument(fileBuffer, 'verifications');
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'raw'
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok') {
      throw new Error('Failed to delete file');
    }

    return true;
  } catch (error) {
    logger.error('File deletion failed:', error);
    throw new AppError('Failed to delete file.', 500);
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Transformation options
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      ...transformations,
    ],
  });
};

/**
 * Validate file before upload
 * @param {object} file - File object from multer
 * @param {string} type - 'image' or 'document'
 */
export const validateFile = (file, type = 'image') => {
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  const allowedFormats = type === 'image' ? ALLOWED_IMAGE_FORMATS : ALLOWED_DOCUMENT_FORMATS;
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;

  // Check file format
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  if (!allowedFormats.includes(fileExtension)) {
    throw new AppError(
      `Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`,
      400
    );
  }

  // Check file size
  if (file.size > maxSize) {
    throw new AppError(
      `File size exceeds limit. Maximum size: ${maxSize / (1024 * 1024)}MB`,
      400
    );
  }

  return true;
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 */
export const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Find the folder path
    const folderIndex = parts.indexOf(process.env.CLOUDINARY_FOLDER || 'doctor-appointment');
    if (folderIndex !== -1) {
      const folderPath = parts.slice(folderIndex, -1).join('/');
      return `${folderPath}/${publicId}`;
    }
    
    return publicId;
  } catch (error) {
    logger.error('Failed to extract public ID:', error);
    return null;
  }
};

export default {
  uploadImage,
  uploadDocument,
  uploadProfileImage,
  uploadVerificationDocument,
  deleteFile,
  getOptimizedImageUrl,
  validateFile,
  extractPublicId,
};
