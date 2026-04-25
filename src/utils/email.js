import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Email Service
 * Handles sending emails using nodemailer
 */

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Verify email connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✓ Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('✗ Email service connection failed:', error.message);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Doctor Appointment System';
    const html = `
      <h1>Welcome ${user.firstName}!</h1>
      <p>Thank you for registering with Doctor Appointment System.</p>
      <p>You can now book appointments with verified doctors.</p>
      <p>Best regards,<br>Doctor Appointment Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(appointment, patient, doctor) {
    const subject = 'Appointment Confirmation';
    const html = `
      <h1>Appointment Confirmed</h1>
      <p>Dear ${patient.firstName},</p>
      <p>Your appointment has been confirmed with the following details:</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctor.fullName}</li>
        <li><strong>Specialization:</strong> ${doctor.specialization}</li>
        <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
        <li><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</li>
      </ul>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>Best regards,<br>Doctor Appointment Team</p>
    `;

    await this.sendEmail({
      to: patient.email,
      subject,
      html,
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(appointment, patient, doctor) {
    const subject = 'Appointment Reminder';
    const html = `
      <h1>Appointment Reminder</h1>
      <p>Dear ${patient.firstName},</p>
      <p>This is a reminder for your upcoming appointment:</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctor.fullName}</li>
        <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
        <li><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</li>
      </ul>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>Best regards,<br>Doctor Appointment Team</p>
    `;

    await this.sendEmail({
      to: patient.email,
      subject,
      html,
    });
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(appointment, patient, doctor) {
    const subject = 'Appointment Cancelled';
    const html = `
      <h1>Appointment Cancelled</h1>
      <p>Dear ${patient.firstName},</p>
      <p>Your appointment has been cancelled:</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctor.fullName}</li>
        <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
        <li><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</li>
        <li><strong>Reason:</strong> ${appointment.cancellationReason || 'Not specified'}</li>
      </ul>
      <p>If payment was made, refund will be processed within 5-7 business days.</p>
      <p>Best regards,<br>Doctor Appointment Team</p>
    `;

    await this.sendEmail({
      to: patient.email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const frontendBaseUrl = user.role === 'doctor'
      ? process.env.FRONTEND_DOCTOR_URL || process.env.FRONTEND_PATIENT_URL || 'http://localhost:3001'
      : process.env.FRONTEND_PATIENT_URL || 'http://localhost:3000';
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>Dear ${user.firstName},</p>
      <p>You requested to reset your password. Click the link below to reset:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Doctor Appointment Team</p>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * Send doctor verification email
   */
  async sendDoctorVerificationEmail(doctor, status) {
    const subject = status === 'approved' ? 'Doctor Profile Approved' : 'Doctor Profile Rejected';
    const html = status === 'approved'
      ? `
        <h1>Congratulations!</h1>
        <p>Dear Dr. ${doctor.fullName},</p>
        <p>Your doctor profile has been verified and approved.</p>
        <p>You can now start accepting appointments from patients.</p>
        <p>Best regards,<br>Doctor Appointment Team</p>
      `
      : `
        <h1>Profile Verification Update</h1>
        <p>Dear Dr. ${doctor.fullName},</p>
        <p>Unfortunately, your doctor profile could not be verified at this time.</p>
        <p>Please contact support for more information.</p>
        <p>Best regards,<br>Doctor Appointment Team</p>
      `;

    await this.sendEmail({
      to: doctor.email,
      subject,
      html,
    });
  }
}

export default new EmailService();
