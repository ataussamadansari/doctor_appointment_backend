import crypto from 'crypto';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/response.js';
import { AppError, AuthenticationError } from '../utils/errors.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import emailService from '../utils/email.js';
import logger from '../utils/logger.js';

/**
 * Authentication Controller
 * Handles user and doctor authentication
 */

const buildAuthPayload = (account, accessToken, refreshToken, extraData = {}) => {
  const accountKey = account.role === 'doctor' ? 'doctor' : 'user';

  return {
    [accountKey]: account,
    accessToken,
    refreshToken,
    ...extraData,
  };
};

/**
 * Register new patient
 */
export const registerUser = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  
  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 409));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Send welcome email (async, don't wait)
  emailService.sendWelcomeEmail(user).catch((err) =>
    logger.error('Error sending welcome email:', err)
  );

  // Remove password from response
  user.password = undefined;

  return ApiResponse.created(
    res,
    buildAuthPayload(user, accessToken, refreshToken),
    'Registration successful'
  );
});

/**
 * Register new doctor
 */
export const registerDoctor = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    specialization,
    registrationNumber,
    experience,
    consultationFee,
    clinicAddress,
  } = req.body;

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({
    $or: [{ email }, { phone }, { registrationNumber }],
  });
  
  if (existingDoctor) {
    return next(
      new AppError('Doctor with this email, phone, or registration number already exists', 409)
    );
  }

  // Create doctor
  const doctor = await Doctor.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    specialization,
    registrationNumber,
    experience,
    consultationFee,
    clinicAddress,
    isVerified: false, // Requires admin verification
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(doctor._id, doctor.role);

  // Save refresh token
  doctor.refreshToken = refreshToken;
  await doctor.save({ validateBeforeSave: false });

  // Remove password from response
  doctor.password = undefined;

  return ApiResponse.created(
    res,
    buildAuthPayload(doctor, accessToken, refreshToken, {
      notice: 'Your profile is pending verification by admin',
    }),
    'Registration successful'
  );
});

/**
 * Login user or doctor
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Try to find user first
  let user = await User.findOne({ email }).select('+password');
  let role = 'patient';

  // If not found in users, try doctors
  if (!user) {
    user = await Doctor.findOne({ email }).select('+password');
    role = 'doctor';
  }

  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    return next(new AuthenticationError('Incorrect email or password'));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 403));
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Save refresh token and update last login
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Remove password from response
  user.password = undefined;

  return ApiResponse.success(
    res,
    buildAuthPayload(user, accessToken, refreshToken),
    'Login successful'
  );
});

/**
 * Request password reset
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const successMessage = 'If an account with that email exists, a reset link has been sent';

  let account = await User.findOne({ email });
  if (!account) {
    account = await Doctor.findOne({ email });
  }

  if (!account) {
    return ApiResponse.success(res, null, successMessage);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  account.passwordResetToken = hashedResetToken;
  account.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await account.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(account, resetToken);
  } catch (error) {
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;
    await account.save({ validateBeforeSave: false });

    logger.error('Error sending password reset email:', error);
    return next(new AppError('Unable to send password reset email at the moment', 500));
  }

  return ApiResponse.success(res, null, successMessage);
});

/**
 * Refresh access token
 */
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return next(new AuthenticationError('Invalid or expired refresh token'));
  }

  // Find user
  let user;
  if (decoded.role === 'doctor') {
    user = await Doctor.findById(decoded.id).select('+refreshToken');
  } else {
    user = await User.findById(decoded.id).select('+refreshToken');
  }

  if (!user) {
    return next(new AuthenticationError('Invalid refresh token'));
  }

  // If stored token doesn't match (e.g. after server restart cleared DB),
  // accept the JWT-verified token and issue fresh tokens
  if (user.refreshToken && user.refreshToken !== refreshToken) {
    return next(new AuthenticationError('Refresh token has been revoked'));
  }

  // Generate new tokens
  const tokens = generateTokens(user._id, user.role);

  // Update refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, tokens, 'Token refreshed successfully');
});

/**
 * Logout
 */
export const logout = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  // Clear refresh token
  if (userRole === 'doctor') {
    await Doctor.findByIdAndUpdate(userId, { refreshToken: null });
  } else {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  return ApiResponse.success(res, null, 'Logout successful');
});

/**
 * Get current user profile
 */
export const getMe = catchAsync(async (req, res, next) => {
  return ApiResponse.success(res, req.user, 'Profile retrieved successfully');
});

/**
 * Update password
 */
export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Get user with password
  let user;
  if (req.user.role === 'doctor') {
    user = await Doctor.findById(req.user._id).select('+password');
  } else {
    user = await User.findById(req.user._id).select('+password');
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new tokens
  const tokens = generateTokens(user._id, user.role);

  return ApiResponse.success(res, tokens, 'Password updated successfully');
});
