import User from '../models/User.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { AppError } from '../utils/errors.js';
import { ApiResponse } from '../utils/response.js';

/**
 * Get current user profile
 */
export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return ApiResponse.success(res, user, 'Profile retrieved successfully');
});

/**
 * Update user profile
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  // Fields that can be updated
  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'address',
    'profileImage',
  ];

  // Filter out fields that are not allowed
  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Prevent updating sensitive fields
  if (req.body.password || req.body.email || req.body.role) {
    return next(
      new AppError('This route is not for password/email/role updates. Please use the appropriate endpoints.', 400)
    );
  }

  // Check if phone is being updated and if it's already taken
  if (updates.phone && updates.phone !== req.user.phone) {
    const existingUser = await User.findOne({ phone: updates.phone });
    if (existingUser) {
      return next(new AppError('Phone number is already in use', 400));
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return ApiResponse.success(res, user, 'Profile updated successfully');
});

/**
 * Update password
 */
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current password and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current password is correct
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, null, 'Password updated successfully');
});

/**
 * Delete account (soft delete)
 */
export const deleteAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return ApiResponse.success(res, null, 'Account deactivated successfully');
});

/**
 * Get user by ID (for admin or doctor to view patient details)
 */
export const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Only allow access if user is admin or doctor
  if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
    return next(new AppError('You do not have permission to view this profile', 403));
  }

  return ApiResponse.success(res, user, 'User retrieved successfully');
});
