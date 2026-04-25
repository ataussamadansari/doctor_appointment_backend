import express from 'express';
import {
  uploadProfileImage,
  uploadVerificationDocument,
  deleteVerificationDocument,
  getSignedUrl,
} from '../controllers/uploadController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { uploadSingle, handleMulterError } from '../middlewares/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload profile image (for both patients and doctors)
router.post(
  '/profile-image',
  uploadSingle('image'),
  handleMulterError,
  uploadProfileImage
);

// Upload verification document (doctors only)
router.post(
  '/verification-document',
  restrictTo('doctor'),
  uploadSingle('document'),
  handleMulterError,
  uploadVerificationDocument
);

// Delete verification document (doctors only)
router.delete(
  '/verification-document/:documentId',
  restrictTo('doctor'),
  deleteVerificationDocument
);

// Get signed URL for a file
router.get('/signed-url/:publicId', getSignedUrl);

export default router;
