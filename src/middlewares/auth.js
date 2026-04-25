import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user/doctor to request
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user/doctor still exists
    let currentUser;
    if (decoded.role === 'doctor') {
      currentUser = await Doctor.findById(decoded.id).select('+passwordChangedAt');
    } else {
      currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
    }

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Check if user changed password after token was issued
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
      }
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    logger.error('Auth middleware error:', error);
    return next(new AppError('Authentication failed.', 401));
  }
};

/**
 * Role-based Authorization Middleware
 * Restricts access based on user roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let currentUser;
      if (decoded.role === 'doctor') {
        currentUser = await Doctor.findById(decoded.id);
      } else {
        currentUser = await User.findById(decoded.id);
      }

      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Verify Doctor Middleware
 * Ensures doctor is verified before accessing certain routes
 */
export const verifyDoctor = (req, res, next) => {
  if (req.user.role === 'doctor' && !req.user.isVerified) {
    return next(
      new AppError('Your doctor profile is not verified yet. Please wait for admin approval.', 403)
    );
  }
  next();
};
