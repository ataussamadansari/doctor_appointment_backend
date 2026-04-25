# Doctor Appointment System - Backend

A production-ready, scalable backend for a Doctor Appointment System built with Node.js, Express, MongoDB, Redis, and Socket.io.

## 🚀 Features

### Core Features
- **User Management**: Patient and Doctor registration/authentication with JWT
- **Appointment Booking**: Real-time slot-based booking with distributed locking
- **Payment Integration**: Razorpay/Stripe integration with webhook support
- **Real-time Updates**: Socket.io for live notifications and slot updates
- **Admin Panel**: Complete admin dashboard for managing users, doctors, and appointments
- **Notifications**: In-app, email, and push notifications
- **Background Jobs**: BullMQ for scheduled tasks and reminders

### Technical Features
- **Distributed Locking**: Redis-based locking to prevent double booking
- **MongoDB Transactions**: ACID compliance for critical operations
- **Caching**: Redis caching for improved performance
- **Rate Limiting**: Protection against abuse and DDoS
- **Input Validation**: Joi-based request validation
- **Error Handling**: Centralized error handling with custom error classes
- **Logging**: Winston logger with daily rotation
- **Security**: Helmet, CORS, input sanitization, JWT authentication

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis >= 7.x
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database URLs
- JWT secrets
- Payment gateway credentials
- Email SMTP settings
- Redis configuration

### 4. Start Services

**Using Docker Compose (Recommended):**
```bash
docker-compose up -d
```

**Manual Start:**
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start Backend
npm run dev

# Start Worker (in separate terminal)
npm run worker
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── redis.js      # Redis client with distributed locking
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Slot.js
│   │   ├── Appointment.js
│   │   ├── Payment.js
│   │   └── Notification.js
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic layer
│   │   ├── appointmentService.js
│   │   ├── paymentService.js
│   │   └── notificationService.js
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.js       # JWT authentication
│   │   ├── validation.js # Request validation
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/           # API routes
│   ├── sockets/          # Socket.io handlers
│   ├── workers/          # Background job processors
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   ├── email.js
│   │   ├── jwt.js
│   │   ├── response.js
│   │   └── errors.js
│   └── server.js         # Application entry point
├── tests/                # Test files
├── logs/                 # Application logs
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/refresh-token     # Refresh access token
POST   /api/v1/auth/logout            # Logout
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password
```

### Doctors
```
GET    /api/v1/doctors                # Get all doctors (with filters)
GET    /api/v1/doctors/:id            # Get doctor by ID
POST   /api/v1/doctors/register       # Doctor registration
PUT    /api/v1/doctors/profile        # Update doctor profile
GET    /api/v1/doctors/me             # Get current doctor profile
POST   /api/v1/doctors/availability   # Set availability schedule
GET    /api/v1/doctors/:id/slots      # Get doctor available slots
```

### Appointments
```
POST   /api/v1/appointments/book      # Book appointment
GET    /api/v1/appointments           # Get user appointments
GET    /api/v1/appointments/:id       # Get appointment details
PATCH  /api/v1/appointments/:id/cancel    # Cancel appointment
PATCH  /api/v1/appointments/:id/complete  # Complete appointment (doctor)
POST   /api/v1/appointments/:id/rating    # Add rating
```

### Payments
```
POST   /api/v1/payments/create        # Create payment order
POST   /api/v1/payments/verify        # Verify payment
POST   /api/v1/payments/webhook       # Payment gateway webhook
GET    /api/v1/payments/:id           # Get payment details
```

### Notifications
```
GET    /api/v1/notifications          # Get user notifications
PATCH  /api/v1/notifications/:id/read # Mark as read
PATCH  /api/v1/notifications/read-all # Mark all as read
GET    /api/v1/notifications/unread-count # Get unread count
```

### Admin
```
GET    /api/v1/admin/users            # Get all users
GET    /api/v1/admin/doctors          # Get all doctors
PATCH  /api/v1/admin/doctors/:id/verify   # Verify doctor
GET    /api/v1/admin/appointments     # Get all appointments
GET    /api/v1/admin/analytics        # Get analytics data
GET    /api/v1/admin/reports          # Generate reports
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: MongoDB sanitization
- **XSS Protection**: Helmet middleware
- **CORS**: Configured for specific origins
- **Distributed Locking**: Prevents race conditions

## 🎯 Appointment Booking Flow

1. **Patient searches for doctors** (by specialization, city, rating)
2. **Patient views available slots** (real-time availability)
3. **Patient books appointment** (with distributed lock)
   - Acquire Redis lock on slot
   - Start MongoDB transaction
   - Verify slot availability
   - Create appointment
   - Book slot
   - Commit transaction
   - Release lock
4. **Payment processing** (Razorpay/Stripe)
5. **Confirmation** (email + in-app notification)
6. **Reminders** (automated via BullMQ)

## 📊 Database Schema

### Collections
- **users**: Patient accounts
- **doctors**: Doctor profiles with qualifications
- **slots**: Time slots for appointments
- **appointments**: Booking records
- **payments**: Payment transactions
- **notifications**: In-app notifications

### Indexes
- Compound indexes for efficient queries
- Unique constraints to prevent duplicates
- TTL indexes for auto-expiring documents

## 🔄 Background Jobs

### BullMQ Workers
- **Appointment Reminders**: Send reminders 24h before appointment
- **Auto-cancel Unpaid**: Cancel unpaid appointments after 15 minutes
- **Slot Generation**: Auto-generate slots based on doctor availability
- **Daily Reports**: Generate and email daily reports
- **Payment Reconciliation**: Verify payment status

## 📝 Logging

Winston logger with:
- Daily log rotation
- Separate error logs
- Console output in development
- File output in production
- Exception and rejection handling

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t doctor-appointment-backend .

# Run container
docker run -p 5000:5000 --env-file .env doctor-appointment-backend
```

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS
- [ ] Configure MongoDB replica set
- [ ] Set up Redis cluster
- [ ] Configure log aggregation
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## 📈 Performance Optimization

- **Redis Caching**: Doctor lists, slots, user data
- **Database Indexing**: Optimized queries
- **Connection Pooling**: MongoDB and Redis
- **Compression**: gzip compression for responses
- **Pagination**: All list endpoints
- **Lazy Loading**: Populate only required fields

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongosh

# Check connection string in .env
```

**Redis Connection Failed**
```bash
# Check Redis is running
redis-cli ping

# Should return PONG
```

**Port Already in Use**
```bash
# Change PORT in .env
PORT=5001
```

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Email: support@doctorappointment.com

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributors

- Your Name - Initial work

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- Redis team
- Socket.io team
- All open-source contributors
