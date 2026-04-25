import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { PaymentError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import notificationService from './notificationService.js';

/**
 * Payment Service
 * Handles payment processing with Razorpay/Stripe
 */

class PaymentService {
  constructor() {
    // Initialize Razorpay
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Create payment order
   */
  async createPaymentOrder(appointmentId, userId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.patient._id.toString() !== userId) {
        throw new PaymentError('Unauthorized to make payment for this appointment');
      }

      if (appointment.paymentStatus === 'paid') {
        throw new PaymentError('Payment already completed for this appointment');
      }

      // Create payment record
      const payment = await Payment.create({
        appointment: appointmentId,
        patient: appointment.patient._id,
        doctor: appointment.doctor._id,
        amount: appointment.consultationFee,
        currency: 'INR',
        paymentGateway: process.env.PAYMENT_GATEWAY || 'razorpay',
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Create Razorpay order
      if (this.razorpay) {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: appointment.consultationFee * 100, // Convert to paise
          currency: 'INR',
          receipt: payment.transactionId,
          notes: {
            appointmentId: appointmentId,
            patientId: userId,
          },
        });

        payment.gatewayOrderId = razorpayOrder.id;
        await payment.save();

        return {
          payment,
          razorpayOrder,
          key: process.env.RAZORPAY_KEY_ID,
        };
      }

      return { payment };
    } catch (error) {
      logger.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new PaymentError('Invalid payment signature');
      }

      // Find payment
      const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Mark payment as success
      await payment.markSuccess({
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        method: 'card', // Get from Razorpay API if needed
      });

      // Update appointment
      const appointment = await Appointment.findById(payment.appointment);
      appointment.paymentStatus = 'paid';
      appointment.payment = payment._id;
      appointment.status = 'confirmed';
      await appointment.save();

      // Send notifications
      await notificationService.sendNotification({
        recipient: payment.patient,
        recipientModel: 'User',
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Payment of ₹${payment.amount} completed successfully.`,
      });

      await notificationService.sendNotification({
        recipient: payment.doctor,
        recipientModel: 'Doctor',
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: 'A new appointment has been confirmed.',
      });

      return { payment, appointment };
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(event, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(JSON.stringify(event))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new PaymentError('Invalid webhook signature');
      }

      const { event: eventType, payload } = event;

      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;

        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;

        default:
          logger.info(`Unhandled webhook event: ${eventType}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle payment captured
   */
  async handlePaymentCaptured(paymentEntity) {
    const payment = await Payment.findOne({ gatewayPaymentId: paymentEntity.id });

    if (payment && payment.status !== 'success') {
      await payment.markSuccess({
        paymentId: paymentEntity.id,
        method: paymentEntity.method,
      });

      const appointment = await Appointment.findById(payment.appointment);
      appointment.paymentStatus = 'paid';
      appointment.status = 'confirmed';
      await appointment.save();
    }
  }

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(paymentEntity) {
    const payment = await Payment.findOne({ gatewayOrderId: paymentEntity.order_id });

    if (payment) {
      await payment.markFailed(paymentEntity.error_description);

      const appointment = await Appointment.findById(payment.appointment);
      appointment.paymentStatus = 'failed';
      await appointment.save();

      // Notify patient
      await notificationService.sendNotification({
        recipient: payment.patient,
        recipientModel: 'User',
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
      });
    }
  }

  /**
   * Handle refund processed
   */
  async handleRefundProcessed(refundEntity) {
    const payment = await Payment.findOne({ gatewayPaymentId: refundEntity.payment_id });

    if (payment) {
      await payment.completeRefund(refundEntity.id);

      // Notify patient
      await notificationService.sendNotification({
        recipient: payment.patient,
        recipientModel: 'User',
        type: 'payment_refund',
        title: 'Refund Processed',
        message: `Refund of ₹${refundEntity.amount / 100} has been processed.`,
      });
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(paymentId, amount, reason) {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      if (payment.status !== 'success') {
        throw new PaymentError('Can only refund successful payments');
      }

      // Initiate refund in Razorpay
      if (this.razorpay && payment.gatewayPaymentId) {
        const refund = await this.razorpay.payments.refund(payment.gatewayPaymentId, {
          amount: (amount || payment.amount) * 100,
          notes: {
            reason,
          },
        });

        await payment.initiateRefund(amount || payment.amount, reason);
        await payment.completeRefund(refund.id);
      } else {
        await payment.initiateRefund(amount || payment.amount, reason);
      }

      return payment;
    } catch (error) {
      logger.error('Error initiating refund:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId, userId) {
    const payment = await Payment.findById(paymentId)
      .populate('appointment')
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization');

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.patient._id.toString() !== userId) {
      throw new PaymentError('Unauthorized to view this payment');
    }

    return payment;
  }

  /**
   * Get doctor earnings
   */
  async getDoctorEarnings(doctorId, startDate, endDate) {
    return await Payment.getDoctorEarnings(doctorId, startDate, endDate);
  }
}

export default new PaymentService();
