import mongoose from 'mongoose';

/**
 * Notification Model
 * Manages in-app notifications for users and doctors
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Recipient is required'],
      index: true,
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['User', 'Doctor'],
    },
    type: {
      type: String,
      required: true,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_reminder',
        'appointment_completed',
        'payment_success',
        'payment_failed',
        'payment_refund',
        'doctor_verified',
        'doctor_rejected',
        'slot_updated',
        'rating_received',
        'general',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    actionUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (recipientId) {
  return this.countDocuments({
    recipient: recipientId,
    isRead: false,
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (recipientId) {
  return this.updateMany(
    { recipient: recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  return await this.create(data);
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = function (
  recipientId,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  return this.find({ recipient: recipientId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
