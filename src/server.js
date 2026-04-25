// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// Then import everything else
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

// Import configurations
import database from './config/database.js';
import redisClient from './config/redis.js';
import cloudinary, { verifyCloudinaryConnection } from './config/cloudinary.js';
import logger from './utils/logger.js';
import emailService from './utils/email.js';

// Import middlewares
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInput } from './middlewares/validation.js';

// Import Socket.io manager
import { socketManager } from './sockets/socketManager.js';

// Import routes (will be created)
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';

/**
 * Initialize Express Application
 */
const app = express();
const server = createServer(app);

/**
 * Security Middlewares
 */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS Configuration
 */
app.use(cors({
  origin: [
    process.env.FRONTEND_PATIENT_URL || 'http://localhost:3000',
    process.env.FRONTEND_DOCTOR_URL || 'http://localhost:3001',
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:3002',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Body Parser Middlewares
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Compression Middleware
 */
app.use(compression());

/**
 * MongoDB Sanitization
 */
app.use(mongoSanitize());

/**
 * Custom Input Sanitization (XSS Prevention)
 */
app.use(sanitizeInput);

/**
 * Request Logging Middleware (Development)
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API Version Info
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Doctor Appointment System API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs',
  });
});

/**
 * Apply Rate Limiting to API Routes
 */
app.use('/api', apiLimiter);

/**
 * API Routes
 */
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// Uncomment when routes are created
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/doctors`, doctorRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
// app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
// app.use(`${API_PREFIX}/admin`, adminRoutes);

/**
 * 404 Handler
 */
app.use(notFound);

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Initialize Database and Start Server
 */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    logger.info('✓ MongoDB connected');

    // Connect to Redis
    await redisClient.connect();
    logger.info('✓ Redis connected');

    // Verify Cloudinary connection (non-blocking)
    verifyCloudinaryConnection().catch(() => {
      // Ignore errors, already logged
    });

    // Verify Email service (non-blocking)
    emailService.verifyConnection().catch(() => {
      // Ignore errors, already logged
    });

    // Initialize Socket.io
    socketManager.initialize(server);
    logger.info('✓ Socket.io initialized');

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`✓ Health Check: http://localhost:${PORT}/health`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    await database.disconnect();
    await redisClient.disconnect();
    
    logger.info('Database connections closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    await database.disconnect();
    await redisClient.disconnect();
    
    logger.info('Database connections closed');
    process.exit(0);
  });
});

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  
  server.close(() => {
    process.exit(1);
  });
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
