import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Slot from '../models/Slot.js';
import Doctor from '../models/Doctor.js';
import Payment from '../models/Payment.js';
import redisClient from '../config/redis.js';
import { AppError, NotFoundError, ConflictError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import notificationService from './notificationService.js';
import emailService from '../utils/email.js';

/**
 * Appointment Service
 * Handles all appointment-related business logic with distributed locking
 */

class AppointmentService {
  /**
   * Book appointment with distributed lock to prevent double booking
   */
  async bookAppointment(patientId, doctorId, slotId, appointmentData) {
    const session = await mongoose.startSession();
    let lockValue = null;

    try {
      // Acquire distributed lock for the slot
      lockValue = await redisClient.acquireLock(`slot:${slotId}`, 10000);
      
      if (!lockValue) {
        throw new ConflictError('This slot is currently being booked. Please try again.');
      }

      // Start MongoDB transaction
      session.startTransaction();

      // Verify slot availability
      const slot = await Slot.findById(slotId).session(session);
      
      if (!slot) {
        throw new NotFoundError('Slot not found');
      }

      if (slot.status !== 'available') {
        throw new ConflictError('This slot is no longer available');
      }

      // Verify doctor
      const doctor = await Doctor.findById(doctorId).session(session);
      
      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      if (!doctor.isVerified || !doctor.isActive) {
        throw new AppError('Doctor is not available for booking', 400);
      }

      // Create appointment
      const appointment = await Appointment.create(
        [
          {
            patient: patientId,
            doctor: doctorId,
            slot: slotId,
            appointmentDate: slot.date,
            appointmentTime: slot.startTime,
            consultationFee: doctor.consultationFee,
            symptoms: appointmentData.symptoms,
            notes: appointmentData.notes,
            status: 'pending',
            paymentStatus: 'pending',
          },
        ],
        { session }
      );

      // Book the slot
      await slot.book(appointment[0]._id);
      await slot.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Release lock
      await redisClient.releaseLock(`slot:${slotId}`, lockValue);

      // Clear cache
      await this.clearAppointmentCache(patientId, doctorId);

      // Send notifications (async, don't wait)
      this.sendBookingNotifications(appointment[0], doctor).catch((err) =>
        logger.error('Error sending booking notifications:', err)
      );

      return appointment[0];
    } catch (error) {
      await session.abortTransaction();
      
      if (lockValue) {
        await redisClient.releaseLock(`slot:${slotId}`, lockValue);
      }

      logger.error('Error booking appointment:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId, userId, userRole, reason) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor')
        .populate('slot')
        .session(session);

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      // Verify ownership
      if (userRole === 'patient' && appointment.patient._id.toString() !== userId) {
        throw new AppError('You can only cancel your own appointments', 403);
      }

      if (userRole === 'doctor' && appointment.doctor._id.toString() !== userId) {
        throw new AppError('You can only cancel your own appointments', 403);
      }

      // Check if appointment can be cancelled
      if (!appointment.canBeCancelled()) {
        const hours = process.env.CANCELLATION_HOURS || 24;
        throw new AppError(
          `Appointments can only be cancelled at least ${hours} hours in advance`,
          400
        );
      }

      // Cancel appointment
      await appointment.cancel(reason, userRole);
      await appointment.save({ session });

      // Release slot
      const slot = await Slot.findById(appointment.slot._id).session(session);
      await slot.release();
      await slot.save({ session });

      // Handle refund if payment was made
      if (appointment.paymentStatus === 'paid') {
        const payment = await Payment.findById(appointment.payment).session(session);
        if (payment) {
          await payment.initiateRefund(payment.amount, reason);
          await payment.save({ session });
        }
      }

      await session.commitTransaction();

      // Clear cache
      await this.clearAppointmentCache(appointment.patient._id, appointment.doctor._id);

      // Send notifications
      this.sendCancellationNotifications(appointment, reason).catch((err) =>
        logger.error('Error sending cancellation notifications:', err)
      );

      return appointment;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error cancelling appointment:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId, userId, userRole) {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email phone profileImage')
      .populate('doctor', 'firstName lastName specialization profileImage consultationFee')
      .populate('slot');

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Verify access
    if (userRole === 'patient' && appointment.patient._id.toString() !== userId) {
      throw new AppError('You can only view your own appointments', 403);
    }

    if (userRole === 'doctor' && appointment.doctor._id.toString() !== userId) {
      throw new AppError('You can only view your own appointments', 403);
    }

    return appointment;
  }

  /**
   * Get user appointments with caching
   */
  async getUserAppointments(userId, userType, filters = {}) {
    const cacheKey = `appointments:${userType}:${userId}:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = { [userType]: userId, isActive: true };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.appointmentDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone profileImage')
      .populate('doctor', 'firstName lastName specialization profileImage consultationFee')
      .populate('slot')
      .sort({ appointmentDate: -1 });

    // Cache for 5 minutes
    await redisClient.set(cacheKey, appointments, 300);

    return appointments;
  }

  /**
   * Complete appointment (doctor only)
   */
  async completeAppointment(appointmentId, doctorId, prescriptionData) {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.doctor.toString() !== doctorId) {
      throw new AppError('You can only complete your own appointments', 403);
    }

    if (appointment.status !== 'confirmed') {
      throw new AppError('Only confirmed appointments can be completed', 400);
    }

    // Add prescription if provided
    if (prescriptionData) {
      appointment.prescription = prescriptionData;
    }

    await appointment.complete();

    // Update doctor stats
    await Doctor.findByIdAndUpdate(doctorId, {
      $inc: { totalAppointments: 1, totalEarnings: appointment.consultationFee },
    });

    // Clear cache
    await this.clearAppointmentCache(appointment.patient, doctorId);

    // Send notification
    notificationService.sendNotification({
      recipient: appointment.patient,
      recipientModel: 'User',
      type: 'appointment_completed',
      title: 'Appointment Completed',
      message: 'Your appointment has been completed. You can now rate your experience.',
    }).catch((err) => logger.error('Error sending notification:', err));

    return appointment;
  }

  /**
   * Add rating to appointment
   */
  async addRating(appointmentId, patientId, score, review) {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.patient.toString() !== patientId) {
      throw new AppError('You can only rate your own appointments', 403);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('You can only rate completed appointments', 400);
    }

    if (appointment.rating && appointment.rating.score) {
      throw new AppError('You have already rated this appointment', 400);
    }

    await appointment.addRating(score, review);

    // Update doctor rating
    await this.updateDoctorRating(appointment.doctor);

    // Send notification to doctor
    notificationService.sendNotification({
      recipient: appointment.doctor,
      recipientModel: 'Doctor',
      type: 'rating_received',
      title: 'New Rating Received',
      message: `You received a ${score}-star rating from a patient.`,
    }).catch((err) => logger.error('Error sending notification:', err));

    return appointment;
  }

  /**
   * Update doctor rating
   */
  async updateDoctorRating(doctorId) {
    const appointments = await Appointment.find({
      doctor: doctorId,
      'rating.score': { $exists: true },
    });

    if (appointments.length === 0) return;

    const totalRating = appointments.reduce((sum, apt) => sum + apt.rating.score, 0);
    const averageRating = totalRating / appointments.length;

    await Doctor.findByIdAndUpdate(doctorId, {
      'rating.average': averageRating,
      'rating.count': appointments.length,
    });

    // Clear doctor cache
    await redisClient.delPattern(`doctor:${doctorId}*`);
  }

  /**
   * Clear appointment cache
   */
  async clearAppointmentCache(patientId, doctorId) {
    await redisClient.delPattern(`appointments:patient:${patientId}*`);
    await redisClient.delPattern(`appointments:doctor:${doctorId}*`);
  }

  /**
   * Send booking notifications
   */
  async sendBookingNotifications(appointment, doctor) {
    // Notify doctor
    await notificationService.sendNotification({
      recipient: doctor._id,
      recipientModel: 'Doctor',
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `You have a new appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}`,
    });
  }

  /**
   * Send cancellation notifications
   */
  async sendCancellationNotifications(appointment, reason) {
    // Notify patient
    await notificationService.sendNotification({
      recipient: appointment.patient._id,
      recipientModel: 'User',
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment has been cancelled. Reason: ${reason}`,
    });

    // Notify doctor
    await notificationService.sendNotification({
      recipient: appointment.doctor._id,
      recipientModel: 'Doctor',
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `An appointment has been cancelled. Reason: ${reason}`,
    });

    // Send email
    await emailService.sendAppointmentCancellation(
      appointment,
      appointment.patient,
      appointment.doctor
    );
  }
}

export default new AppointmentService();
