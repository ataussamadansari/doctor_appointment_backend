import express from 'express';
import {
  getDashboardStats,
  getDoctorById,
  getDoctors,
  getDoctorSlots,
  getEarnings,
  updateAvailability,
  getMyAvailability,
  updateDoctorProfile,
  getQualifications,
  addQualification,
  updateQualification,
  deleteQualification,
  getVerificationDocuments,
  addVerificationDocument,
  deleteVerificationDocument,
} from '../controllers/doctorController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { validate, schemas } from '../middlewares/validation.js';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.get('/', getDoctors);
router.get('/:id/slots', getDoctorSlots);
router.get('/:id', getDoctorById);

// ── Protected doctor-only routes ───────────────────────────────────────────
router.use(protect, restrictTo('doctor'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/earnings', getEarnings);
router.patch('/profile', updateDoctorProfile);

// Availability
router.get('/me/availability', getMyAvailability);
router.patch('/availability', validate(schemas.setAvailability), updateAvailability);

// Qualifications CRUD
router.get('/me/qualifications', getQualifications);
router.post('/me/qualifications', validate(schemas.qualification), addQualification);
router.patch('/me/qualifications/:qualId', validate(schemas.qualification), updateQualification);
router.delete('/me/qualifications/:qualId', deleteQualification);

// Verification Documents CRUD
router.get('/me/documents', getVerificationDocuments);
router.post('/me/documents', validate(schemas.verificationDocument), addVerificationDocument);
router.delete('/me/documents/:docId', deleteVerificationDocument);

export default router;
