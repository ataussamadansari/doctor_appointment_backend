import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

/**
 * Socket.io Manager
 * Handles real-time communication for notifications and updates
 */

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_PATIENT_URL,
          process.env.FRONTEND_DOCTOR_URL,
          process.env.FRONTEND_ADMIN_URL,
        ],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: Token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user exists
        let user;
        if (decoded.role === 'doctor') {
          user = await Doctor.findById(decoded.id);
        } else {
          user = await User.findById(decoded.id);
        }

        if (!user || !user.isActive) {
          return next(new Error('Authentication error: User not found or inactive'));
        }

        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.io server initialized');
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    logger.info(`User connected: ${userId} (${userRole})`);

    // Store connection
    this.connectedUsers.set(userId, socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room
    socket.join(`role:${userRole}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time server',
      userId,
      userRole,
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle custom events
    this.registerEventHandlers(socket);
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    const userId = socket.userId;
    logger.info(`User disconnected: ${userId}`);

    this.connectedUsers.delete(userId);
  }

  /**
   * Register custom event handlers
   */
  registerEventHandlers(socket) {
    // Join appointment room (for real-time updates)
    socket.on('join:appointment', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
      logger.info(`User ${socket.userId} joined appointment room: ${appointmentId}`);
    });

    // Leave appointment room
    socket.on('leave:appointment', (appointmentId) => {
      socket.leave(`appointment:${appointmentId}`);
      logger.info(`User ${socket.userId} left appointment room: ${appointmentId}`);
    });

    // Join doctor room (for slot updates)
    socket.on('join:doctor', (doctorId) => {
      socket.join(`doctor:${doctorId}`);
      logger.info(`User ${socket.userId} joined doctor room: ${doctorId}`);
    });

    // Leave doctor room
    socket.on('leave:doctor', (doctorId) => {
      socket.leave(`doctor:${doctorId}`);
      logger.info(`User ${socket.userId} left doctor room: ${doctorId}`);
    });

    // Typing indicator (for chat if implemented)
    socket.on('typing:start', (data) => {
      socket.to(`appointment:${data.appointmentId}`).emit('typing:start', {
        userId: socket.userId,
        userRole: socket.userRole,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`appointment:${data.appointmentId}`).emit('typing:stop', {
        userId: socket.userId,
        userRole: socket.userRole,
      });
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId, notification) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', notification);
    logger.info(`Notification sent to user: ${userId}`);
  }

  /**
   * Send notification update
   */
  sendNotificationUpdate(userId, update) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification:update', update);
  }

  /**
   * Broadcast slot update
   */
  broadcastSlotUpdate(doctorId, slotData) {
    if (!this.io) return;

    this.io.to(`doctor:${doctorId}`).emit('slot:update', slotData);
    logger.info(`Slot update broadcasted for doctor: ${doctorId}`);
  }

  /**
   * Send appointment update
   */
  sendAppointmentUpdate(appointmentId, update) {
    if (!this.io) return;

    this.io.to(`appointment:${appointmentId}`).emit('appointment:update', update);
    logger.info(`Appointment update sent: ${appointmentId}`);
  }

  /**
   * Broadcast to role
   */
  broadcastToRole(role, event, data) {
    if (!this.io) return;

    this.io.to(`role:${role}`).emit(event, data);
    logger.info(`Broadcast to role ${role}: ${event}`);
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(event, data) {
    if (!this.io) return;

    this.io.emit(event, data);
    logger.info(`Broadcast to all: ${event}`);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    return this.io;
  }
}

export const socketManager = new SocketManager();
