import express from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
  getUserById,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { validate, schemas } from '../middlewares/validation.js';
import Joi from 'joi';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getProfile);
router.patch('/profile', validate(schemas.updateProfile), updateProfile);
router.patch('/password', validate(schemas.updatePassword), updatePassword);
router.delete('/account', deleteAccount);

// Get user by ID (for admin/doctor)
router.get('/:id', restrictTo('admin', 'doctor'), getUserById);

export default router;
