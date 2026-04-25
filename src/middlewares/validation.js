import Joi from 'joi';
import mongoSanitize from 'express-mongo-sanitize';
import { AppError } from '../utils/errors.js';

/**
 * Validation Middleware using Joi
 * Validates request body, params, and query
 */

/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS and NoSQL injection
 */
export const sanitizeInput = (req, res, next) => {
  // Remove any keys that start with $ or contain .
  mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  mongoSanitize.sanitize(req.query, { replaceWith: '_' });

  // Basic XSS prevention - strip HTML tags from string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove HTML tags and script content
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => {
        value[key] = sanitizeValue(value[key]);
      });
    }
    return value;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }

    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }

    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // User registration
  userRegister: Joi.object({
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
    email: Joi.string().email().lowercase().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(6).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  }),

  // User profile update
  updateProfile: Joi.object({
    firstName: Joi.string().trim().max(50),
    lastName: Joi.string().trim().max(50),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    dateOfBirth: Joi.date().max('now'),
    gender: Joi.string().valid('male', 'female', 'other'),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      zipCode: Joi.string().max(20),
      country: Joi.string().max(100),
    }),
    profileImage: Joi.string().uri(),
  }),

  // Password update
  updatePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  // Forgot password
  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().required(),
  }),

  // Doctor registration
  doctorRegister: Joi.object({
    firstName: Joi.string().trim().max(50).required(),
    lastName: Joi.string().trim().max(50).required(),
    email: Joi.string().email().lowercase().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(6).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    specialization: Joi.string().required(),
    registrationNumber: Joi.string().required(),
    experience: Joi.number().min(0).required(),
    consultationFee: Joi.number().min(0).required(),
    clinicAddress: Joi.object({
      clinicName: Joi.string(),
      street: Joi.string(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string(),
      country: Joi.string().default('India'),
    }).required(),
  }),

  // Appointment booking
  bookAppointment: Joi.object({
    doctorId: Joi.string().hex().length(24).required(),
    slotId: Joi.string().hex().length(24).required(),
    symptoms: Joi.string().max(500),
    notes: Joi.string().max(1000),
  }),

  // Appointment cancellation
  cancelAppointment: Joi.object({
    reason: Joi.string().max(500).required(),
  }),

  // Qualification
  qualification: Joi.object({
    degree: Joi.string().trim().max(100).required(),
    institution: Joi.string().trim().max(200).required(),
    year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),
  }),

  // Verification document
  verificationDocument: Joi.object({
    documentType: Joi.string()
      .valid('medical_degree', 'registration_certificate', 'identity_proof', 'address_proof', 'other')
      .required(),
    documentUrl: Joi.string().uri().required(),
  }),

  // Doctor availability
  setAvailability: Joi.object({
    availability: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().min(0).max(6).required(),
        slots: Joi.array().items(
          Joi.object({
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          })
        ).required(),
      })
    ).required(),
  }),

  // Rating
  addRating: Joi.object({
    score: Joi.number().min(1).max(5).required(),
    review: Joi.string().max(500),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
  }),

  // MongoDB ObjectId
  objectId: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};
