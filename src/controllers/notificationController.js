import Notification from '../models/Notification.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { ApiResponse } from '../utils/response.js';

const mapNotificationType = (type) => {
  if (type.startsWith('appointment_')) return 'appointment';
  if (type.startsWith('payment_')) return 'payment';
  if (type === 'general') return 'general';
  return type;
};

const toNotificationResponse = (notification) => ({
  _id: notification._id,
  title: notification.title,
  message: notification.message,
  type: mapNotificationType(notification.type),
  isRead: notification.isRead,
  referenceId: notification.data?.appointmentId || notification.data?.referenceId,
  referenceType: notification.data?.referenceType,
  createdAt: notification.createdAt,
});

export const getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  }).sort({ createdAt: -1 }).limit(50);

  return ApiResponse.success(res, notifications.map(toNotificationResponse));
});

export const markNotificationAsRead = catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );

  return ApiResponse.success(res, null, 'Notification marked as read');
});

export const markAllNotificationsAsRead = catchAsync(async (req, res) => {
  await Notification.markAllAsRead(req.user._id);
  return ApiResponse.success(res, null, 'All notifications marked as read');
});
