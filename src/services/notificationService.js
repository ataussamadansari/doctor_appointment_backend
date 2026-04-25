import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import { socketManager } from '../sockets/socketManager.js';

/**
 * Notification Service
 * Handles in-app and real-time notifications
 */

class NotificationService {
  /**
   * Send notification
   */
  async sendNotification(data) {
    try {
      const notification = await Notification.create(data);

      // Send real-time notification via Socket.io
      socketManager.sendNotification(data.recipient.toString(), notification);

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications) {
    try {
      const created = await Notification.insertMany(notifications);

      // Send real-time notifications
      created.forEach((notification) => {
        socketManager.sendNotification(
          notification.recipient.toString(),
          notification
        );
      });

      return created;
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();

    // Send real-time update
    socketManager.sendNotificationUpdate(userId, notification);

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.markAllAsRead(userId);

    // Send real-time update
    socketManager.sendNotificationUpdate(userId, { allRead: true });

    return { success: true };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId,
    });

    return result.deletedCount > 0;
  }
}

export default new NotificationService();
