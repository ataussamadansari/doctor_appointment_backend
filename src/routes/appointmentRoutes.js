import express from 'express';
import {
  acceptAppointment,
  bookAppointment,
  cancelAppointment,
  completeAppointment,
  getAppointmentById,
  getDoctorAppointments,
  getPatientAppointments,
  rateAppointment,
  rejectAppointment,
} from '../controllers/appointmentController.js';
import { protect, restrictTo, verifyDoctor } from '../middlewares/auth.js';
import { validate, schemas } from '../middlewares/validation.js';

const router = express.Router();

router.use(protect);

router.post('/', bookAppointment);
router.get('/patient', restrictTo('patient'), getPatientAppointments);
router.get('/doctor', restrictTo('doctor'), verifyDoctor, getDoctorAppointments);
router.get('/:id', getAppointmentById);
router.patch('/:id/cancel', validate(schemas.cancelAppointment), cancelAppointment);
router.patch('/:id/accept', restrictTo('doctor'), verifyDoctor, acceptAppointment);
router.patch('/:id/reject', restrictTo('doctor'), verifyDoctor, validate(schemas.cancelAppointment), rejectAppointment);
router.patch('/:id/complete', restrictTo('doctor'), verifyDoctor, completeAppointment);
router.post('/:id/rate', restrictTo('patient'), validate(schemas.addRating), rateAppointment);

export default router;
