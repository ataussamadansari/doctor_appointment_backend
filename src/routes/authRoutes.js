import express from 'express';
import {
  registerUser,
  registerDoctor,
  login,
  forgotPassword,
  refreshToken,
  logout,
  getMe,
  updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate, schemas } from '../middlewares/validation.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * Public Routes
 */

// Patient registration
router.post(
  ['/register/patient', '/register/user'],
  authLimiter,
  validate(schemas.userRegister),
  registerUser
);

// Doctor registration
router.post(
  '/register/doctor',
  authLimiter,
  validate(schemas.doctorRegister),
  registerDoctor
);

// Login
router.post(
  '/login',
  authLimiter,
  validate(schemas.login),
  login
);

// Forgot password
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(schemas.forgotPassword),
  forgotPassword
);

// Refresh token
router.post(['/refresh', '/refresh-token'], refreshToken);

/**
 * Protected Routes
 */

// Logout
router.post('/logout', protect, logout);

// Get current user
router.get('/me', protect, getMe);

// Update password
router.patch('/update-password', protect, updatePassword);

export default router;
