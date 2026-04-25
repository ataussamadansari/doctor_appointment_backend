import { catchAsync } from '../middlewares/errorHandler.js';
import { AppError } from '../utils/errors.js';
import { ApiResponse } from '../utils/response.js';
import uploadService from '../services/uploadService.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

/**
 * Upload profile image
 */
export const uploadProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  // Validate file
  uploadService.validateFile(req.file, 'image');

  // Upload buffer directly to Cloudinary
  const result = await uploadService.uploadProfileImage(req.file.buffer);

  // Update user/doctor profile
  const Model = req.user.role === 'doctor' ? Doctor : User;
  const user = await Model.findByIdAndUpdate(
    req.user._id,
    { profileImage: result.url },
    { new: true }
  );

  // Delete old image if exists
  if (req.user.profileImage) {
    const oldPublicId = uploadService.extractPublicId(req.user.profileImage);
    if (oldPublicId) {
      await uploadService.deleteFile(oldPublicId, 'image').catch(() => {
        // Ignore deletion errors
      });
    }
  }

  return ApiResponse.success(res, {
    url: result.url,
    user,
  }, 'Profile image uploaded successfully');
});

/**
 * Upload doctor verification document
 */
export const uploadVerificationDocument = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return next(new AppError('Only doctors can upload verification documents', 403));
  }

  if (!req.file) {
    return next(new AppError('Please upload a document', 400));
  }

  const { documentType } = req.body;
  if (!documentType) {
    return next(new AppError('Document type is required', 400));
  }

  const validDocumentTypes = [
    'medical_degree',
    'registration_certificate',
    'identity_proof',
    'address_proof',
    'other',
  ];

  if (!validDocumentTypes.includes(documentType)) {
    return next(new AppError('Invalid document type', 400));
  }

  // Validate file
  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isDocument = ['pdf', 'doc', 'docx'].includes(fileExtension);

  if (!isImage && !isDocument) {
    return next(new AppError('Invalid file format', 400));
  }

  // Upload buffer directly to Cloudinary
  const result = isImage
    ? await uploadService.uploadImage(req.file.buffer, 'verifications')
    : await uploadService.uploadDocument(req.file.buffer, 'verifications');

  // Add document to doctor's verification documents
  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        verificationDocuments: {
          documentType,
          documentUrl: result.url,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  return ApiResponse.success(res, {
    url: result.url,
    documentType,
    doctor,
  }, 'Verification document uploaded successfully');
});

/**
 * Delete verification document
 */
export const deleteVerificationDocument = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return next(new AppError('Only doctors can delete verification documents', 403));
  }

  const { documentId } = req.params;

  const doctor = await Doctor.findById(req.user._id);
  const document = doctor.verificationDocuments.id(documentId);

  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  // Delete from Cloudinary
  const publicId = uploadService.extractPublicId(document.documentUrl);
  if (publicId) {
    const fileExtension = document.documentUrl.split('.').pop().toLowerCase();
    const resourceType = ['pdf', 'doc', 'docx'].includes(fileExtension) ? 'raw' : 'image';
    await uploadService.deleteFile(publicId, resourceType).catch(() => {
      // Ignore deletion errors
    });
  }

  // Remove from database
  doctor.verificationDocuments.pull(documentId);
  await doctor.save();

  return ApiResponse.success(res, doctor, 'Document deleted successfully');
});

/**
 * Get signed URL for file (if needed for private files)
 */
export const getSignedUrl = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  // Generate optimized URL
  const url = uploadService.getOptimizedImageUrl(publicId);

  return ApiResponse.success(res, { url }, 'Signed URL generated successfully');
});
