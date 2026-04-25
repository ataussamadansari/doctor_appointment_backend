import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Email Service
 * Lazy transporter — created on first use so dotenv is always loaded first.
 */

class EmailService {
  // Transporter is created lazily on first use
  getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      port: process.env.EMAIL_PORT,
      host: process.env.EMAIL_HOST,
      secure: process.env.EMAIL_SECURE,
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
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('⚠️  Email credentials not configured.');
        return false;
      }
      await this.getTransporter().verify();
      logger.info('✓ Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('✗ Email service connection failed:', error.message);
      return false;
    }
  }

  /**
   * Core send method
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      const transporter = this.getTransporter();
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html || text,
      };
      const info = await transporter.sendMail(mailOptions);
      logger.info(`✓ Email sent to ${to} — ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email error:', error.message);
      throw new Error('Email could not be sent: ' + error.message);
    }
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  async sendWelcomeEmail(user) {
    await this.sendEmail({
      to: user.email,
      subject: `Welcome to KYRO, ${user.firstName}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#2563eb">Welcome, ${user.firstName}! 👋</h2>
          <p>Thank you for registering with <strong>KYRO Doctor Appointment</strong>.</p>
          <p>You can now book appointments with verified doctors anytime.</p>
          <br/>
          <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
        </div>
      `,
    });
  }

  async sendAppointmentConfirmation(appointment, patient, doctor) {
    await this.sendEmail({
      to: patient.email,
      subject: 'Appointment Confirmed ✅',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#16a34a">Appointment Confirmed ✅</h2>
          <p>Dear <strong>${patient.firstName}</strong>,</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Doctor</td><td style="padding:8px">Dr. ${doctor.firstName} ${doctor.lastName}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Specialization</td><td style="padding:8px">${doctor.specialization}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Date</td><td style="padding:8px">${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Time</td><td style="padding:8px">${appointment.appointmentTime}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Appointment #</td><td style="padding:8px">${appointment.appointmentNumber}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px">Please arrive 10 minutes early.</p>
          <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
        </div>
      `,
    });
  }

  async sendAppointmentReminder(appointment, patient, doctor) {
    await this.sendEmail({
      to: patient.email,
      subject: '⏰ Appointment Reminder — Tomorrow',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#d97706">⏰ Appointment Reminder</h2>
          <p>Dear <strong>${patient.firstName}</strong>, your appointment is coming up!</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Doctor</td><td style="padding:8px">Dr. ${doctor.firstName} ${doctor.lastName}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Date</td><td style="padding:8px">${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Time</td><td style="padding:8px">${appointment.appointmentTime}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
        </div>
      `,
    });
  }

  async sendAppointmentCancellation(appointment, patient, doctor) {
    await this.sendEmail({
      to: patient.email,
      subject: 'Appointment Cancelled ❌',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#dc2626">Appointment Cancelled ❌</h2>
          <p>Dear <strong>${patient.firstName}</strong>,</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Doctor</td><td style="padding:8px">Dr. ${doctor.firstName} ${doctor.lastName}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Date</td><td style="padding:8px">${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Time</td><td style="padding:8px">${appointment.appointmentTime}</td></tr>
            <tr><td style="padding:8px;background:#f9fafb;font-weight:bold">Reason</td><td style="padding:8px">${appointment.cancellationReason || 'Not specified'}</td></tr>
          </table>
          <p>If payment was made, refund will be processed within 5–7 business days.</p>
          <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const base = process.env.FRONTEND_URL
      || (user.role === 'doctor' ? process.env.FRONTEND_DOCTOR_URL : process.env.FRONTEND_PATIENT_URL)
      || 'http://localhost:3000';
    const resetUrl = `${base}/reset-password/${resetToken}`;

    await this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password 🔐',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#2563eb">Reset Your Password 🔐</h2>
          <p>Dear <strong>${user.firstName}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Reset Password</a>
          <p style="color:#6b7280;font-size:13px">If you didn't request this, ignore this email.</p>
          <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
        </div>
      `,
    });
  }

  async sendDoctorVerificationEmail(doctor, status) {
    const approved = status === 'approved';
    await this.sendEmail({
      to: doctor.email,
      subject: approved ? '🎉 Profile Approved!' : 'Profile Verification Update',
      html: approved
        ? `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#16a34a">Congratulations, Dr. ${doctor.firstName}! 🎉</h2>
            <p>Your doctor profile has been <strong>verified and approved</strong>.</p>
            <p>You can now start accepting appointments from patients.</p>
            <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
          </div>
        `
        : `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#dc2626">Profile Verification Update</h2>
            <p>Dear Dr. <strong>${doctor.firstName}</strong>,</p>
            <p>Unfortunately, your profile could not be verified at this time. Please contact support.</p>
            <p style="color:#6b7280;font-size:13px">— KYRO Team</p>
          </div>
        `,
    });
  }
}

export default new EmailService();
