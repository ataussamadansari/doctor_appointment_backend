import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errors.js';

/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP, please try again later.', 429));
  },
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
  handler: (req, res, next) => {
    next(new AppError('Too many login attempts, please try again after 15 minutes.', 429));
  },
});

// Rate limiter for appointment booking
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour
  message: 'Too many booking attempts, please try again later.',
  handler: (req, res, next) => {
    next(new AppError('Too many booking attempts, please try again later.', 429));
  },
});

// Rate limiter for OTP requests
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per window
  message: 'Too many OTP requests, please try again after 15 minutes.',
  handler: (req, res, next) => {
    next(new AppError('Too many OTP requests, please try again after 15 minutes.', 429));
  },
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again after an hour.',
  handler: (req, res, next) => {
    next(new AppError('Too many password reset attempts, please try again after an hour.', 429));
  },
});
