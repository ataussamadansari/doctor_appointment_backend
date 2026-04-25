# Environment Variables Documentation

Complete guide to all environment variables used in the Doctor Appointment System backend.

---

## 📋 Table of Contents

1. [Server Configuration](#server-configuration)
2. [Database Configuration](#database-configuration)
3. [Redis Configuration](#redis-configuration)
4. [JWT Configuration](#jwt-configuration)
5. [AWS S3 Configuration](#aws-s3-configuration)
6. [Payment Gateway Configuration](#payment-gateway-configuration)
7. [Email Configuration](#email-configuration)
8. [SMS Configuration](#sms-configuration)
9. [Frontend URLs](#frontend-urls)
10. [Rate Limiting](#rate-limiting)
11. [File Upload](#file-upload)
12. [Appointment Configuration](#appointment-configuration)
13. [Logging](#logging)

---

## Server Configuration

### NODE_ENV
- **Type**: String
- **Required**: Yes
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Description**: Application environment mode
- **Example**: `NODE_ENV=production`

### PORT
- **Type**: Number
- **Required**: No
- **Default**: `5000`
- **Description**: Port number for the server
- **Example**: `PORT=5000`

### API_VERSION
- **Type**: String
- **Required**: No
- **Default**: `v1`
- **Description**: API version for routing
- **Example**: `API_VERSION=v1`

---

## Database Configuration

### MONGODB_URI
- **Type**: String (Connection URL)
- **Required**: Yes
- **Default**: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority`
- **Description**: MongoDB Atlas connection string
- **Format**: `mongodb+srv://[username:password@]cluster.mongodb.net/database[?options]`
- **Examples**:
  ```
  # MongoDB Atlas (Recommended)
  MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
  
  # Local MongoDB (Alternative)
  MONGODB_URI=mongodb://localhost:27017/doctor_appointment
  
  # With authentication (Local)
  MONGODB_URI=mongodb://admin:password@localhost:27017/doctor_appointment?authSource=admin
  
  # Replica Set
  MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/doctor_appointment?replicaSet=rs0
  ```
- **How to get MongoDB Atlas URI**:
  1. Go to https://cloud.mongodb.com/
  2. Create a free cluster (M0)
  3. Click "Connect" → "Connect your application"
  4. Copy the connection string
  5. Replace `<password>` with your database user password
  6. Replace `<dbname>` with `doctor_appointment`

### MONGODB_TEST_URI
- **Type**: String (Connection URL)
- **Required**: No (only for testing)
- **Default**: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/doctor_appointment_test?retryWrites=true&w=majority`
- **Description**: MongoDB Atlas connection string for test database
- **Example**: `MONGODB_TEST_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment_test?retryWrites=true&w=majority`
- **Note**: Use a separate database name for testing

---

## Redis Configuration

### REDIS_HOST
- **Type**: String (Hostname/IP)
- **Required**: Yes
- **Default**: `localhost`
- **Description**: Redis server hostname
- **Example**: `REDIS_HOST=localhost`

### REDIS_PORT
- **Type**: Number
- **Required**: Yes
- **Default**: `6379`
- **Description**: Redis server port
- **Example**: `REDIS_PORT=6379`

### REDIS_PASSWORD
- **Type**: String
- **Required**: No (if Redis has no password)
- **Default**: Empty
- **Description**: Redis authentication password
- **Example**: `REDIS_PASSWORD=your_redis_password`
- **Note**: Leave empty if Redis doesn't require authentication

---

## JWT Configuration

### JWT_SECRET
- **Type**: String
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Description**: Secret key for signing access tokens
- **Security**: Must be strong and unique
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-min-32-chars`
- **Generation**:
  ```bash
  # Using OpenSSL
  openssl rand -base64 32
  
  # Using Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### JWT_REFRESH_SECRET
- **Type**: String
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Description**: Secret key for signing refresh tokens
- **Security**: Must be different from JWT_SECRET
- **Example**: `JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars`

### JWT_EXPIRE
- **Type**: String (Time duration)
- **Required**: No
- **Default**: `15m`
- **Description**: Access token expiration time
- **Format**: Number + unit (s=seconds, m=minutes, h=hours, d=days)
- **Examples**:
  ```
  JWT_EXPIRE=15m    # 15 minutes
  JWT_EXPIRE=1h     # 1 hour
  JWT_EXPIRE=30m    # 30 minutes
  ```

### JWT_REFRESH_EXPIRE
- **Type**: String (Time duration)
- **Required**: No
- **Default**: `7d`
- **Description**: Refresh token expiration time
- **Examples**:
  ```
  JWT_REFRESH_EXPIRE=7d     # 7 days
  JWT_REFRESH_EXPIRE=30d    # 30 days
  JWT_REFRESH_EXPIRE=90d    # 90 days
  ```

---

## AWS S3 Configuration

### AWS_ACCESS_KEY_ID
- **Type**: String
- **Required**: No (only if using S3)
- **Description**: AWS access key ID for S3
- **Example**: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- **How to get**: AWS Console → IAM → Users → Security Credentials

### AWS_SECRET_ACCESS_KEY
- **Type**: String
- **Required**: No (only if using S3)
- **Description**: AWS secret access key for S3
- **Example**: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Security**: Keep this secret and never commit to version control

### AWS_REGION
- **Type**: String
- **Required**: No
- **Default**: `us-east-1`
- **Description**: AWS region for S3 bucket
- **Examples**: `us-east-1`, `us-west-2`, `eu-west-1`, `ap-south-1`

### AWS_S3_BUCKET
- **Type**: String
- **Required**: No (only if using S3)
- **Description**: S3 bucket name for file uploads
- **Example**: `AWS_S3_BUCKET=doctor-appointment-uploads`

---

## Payment Gateway Configuration

### RAZORPAY_KEY_ID
- **Type**: String
- **Required**: No (if using Razorpay)
- **Description**: Razorpay API key ID
- **Example**: `RAZORPAY_KEY_ID=rzp_test_1234567890`
- **How to get**: Razorpay Dashboard → Settings → API Keys
- **Note**: Use `rzp_test_` for testing, `rzp_live_` for production

### RAZORPAY_KEY_SECRET
- **Type**: String
- **Required**: No (if using Razorpay)
- **Description**: Razorpay API key secret
- **Example**: `RAZORPAY_KEY_SECRET=your_razorpay_secret`
- **Security**: Keep this secret

### STRIPE_SECRET_KEY
- **Type**: String
- **Required**: No (if using Stripe)
- **Description**: Stripe secret key
- **Example**: `STRIPE_SECRET_KEY=sk_test_1234567890`
- **How to get**: Stripe Dashboard → Developers → API Keys
- **Note**: Use `sk_test_` for testing, `sk_live_` for production

### STRIPE_WEBHOOK_SECRET
- **Type**: String
- **Required**: No (if using Stripe webhooks)
- **Description**: Stripe webhook signing secret
- **Example**: `STRIPE_WEBHOOK_SECRET=whsec_1234567890`
- **How to get**: Stripe Dashboard → Developers → Webhooks

### PAYMENT_GATEWAY
- **Type**: String
- **Required**: No
- **Default**: `razorpay`
- **Values**: `razorpay`, `stripe`, `cash`
- **Description**: Default payment gateway to use
- **Example**: `PAYMENT_GATEWAY=razorpay`

---

## Email Configuration

### SMTP_HOST
- **Type**: String (Hostname)
- **Required**: No (if using email)
- **Default**: `smtp.gmail.com`
- **Description**: SMTP server hostname
- **Examples**:
  ```
  SMTP_HOST=smtp.gmail.com          # Gmail
  SMTP_HOST=smtp.sendgrid.net       # SendGrid
  SMTP_HOST=smtp.mailgun.org        # Mailgun
  SMTP_HOST=smtp-mail.outlook.com   # Outlook
  ```

### SMTP_PORT
- **Type**: Number
- **Required**: No
- **Default**: `587`
- **Description**: SMTP server port
- **Common Ports**:
  - `587` - TLS (recommended)
  - `465` - SSL
  - `25` - Non-encrypted (not recommended)
- **Example**: `SMTP_PORT=587`

### SMTP_USER
- **Type**: String (Email)
- **Required**: No (if using email)
- **Description**: SMTP authentication username (usually email)
- **Example**: `SMTP_USER=your-email@gmail.com`

### SMTP_PASSWORD
- **Type**: String
- **Required**: No (if using email)
- **Description**: SMTP authentication password
- **Example**: `SMTP_PASSWORD=your_app_password`
- **Gmail Note**: Use App Password, not regular password
  - Enable 2FA on Gmail
  - Generate App Password: Google Account → Security → App Passwords

### EMAIL_FROM
- **Type**: String (Email)
- **Required**: No
- **Default**: `noreply@doctorappointment.com`
- **Description**: Default sender email address
- **Example**: `EMAIL_FROM=noreply@doctorappointment.com`

---

## SMS Configuration

### SMS_API_KEY
- **Type**: String
- **Required**: No (if using SMS)
- **Description**: SMS service API key (Twilio, AWS SNS, etc.)
- **Example**: `SMS_API_KEY=your_sms_api_key`

### SMS_SENDER_ID
- **Type**: String
- **Required**: No (if using SMS)
- **Description**: SMS sender ID or phone number
- **Example**: `SMS_SENDER_ID=DOCAPPT`

---

## Frontend URLs

### FRONTEND_PATIENT_URL
- **Type**: String (URL)
- **Required**: Yes
- **Default**: `http://localhost:3000`
- **Description**: Patient frontend application URL
- **Examples**:
  ```
  FRONTEND_PATIENT_URL=http://localhost:3000              # Development
  FRONTEND_PATIENT_URL=https://patient.doctorapp.com      # Production
  ```

### FRONTEND_DOCTOR_URL
- **Type**: String (URL)
- **Required**: Yes
- **Default**: `http://localhost:3001`
- **Description**: Doctor frontend application URL
- **Examples**:
  ```
  FRONTEND_DOCTOR_URL=http://localhost:3001               # Development
  FRONTEND_DOCTOR_URL=https://doctor.doctorapp.com        # Production
  ```

### FRONTEND_ADMIN_URL
- **Type**: String (URL)
- **Required**: Yes
- **Default**: `http://localhost:3002`
- **Description**: Admin frontend application URL
- **Examples**:
  ```
  FRONTEND_ADMIN_URL=http://localhost:3002                # Development
  FRONTEND_ADMIN_URL=https://admin.doctorapp.com          # Production
  ```

---

## Rate Limiting

### RATE_LIMIT_WINDOW_MS
- **Type**: Number (Milliseconds)
- **Required**: No
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limiting
- **Example**: `RATE_LIMIT_WINDOW_MS=900000`
- **Conversions**:
  ```
  1 minute  = 60000
  5 minutes = 300000
  15 minutes = 900000
  1 hour = 3600000
  ```

### RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum requests per window
- **Example**: `RATE_LIMIT_MAX_REQUESTS=100`

---

## File Upload

### MAX_FILE_SIZE
- **Type**: Number (Bytes)
- **Required**: No
- **Default**: `5242880` (5MB)
- **Description**: Maximum file upload size in bytes
- **Example**: `MAX_FILE_SIZE=5242880`
- **Conversions**:
  ```
  1 MB = 1048576 bytes
  5 MB = 5242880 bytes
  10 MB = 10485760 bytes
  ```

### ALLOWED_FILE_TYPES
- **Type**: String (Comma-separated MIME types)
- **Required**: No
- **Default**: `image/jpeg,image/png,image/jpg,application/pdf`
- **Description**: Allowed file MIME types for upload
- **Example**: `ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf`

---

## Appointment Configuration

### SLOT_DURATION_MINUTES
- **Type**: Number
- **Required**: No
- **Default**: `30`
- **Description**: Duration of each appointment slot in minutes
- **Example**: `SLOT_DURATION_MINUTES=30`

### BOOKING_ADVANCE_DAYS
- **Type**: Number
- **Required**: No
- **Default**: `30`
- **Description**: How many days in advance patients can book
- **Example**: `BOOKING_ADVANCE_DAYS=30`

### CANCELLATION_HOURS
- **Type**: Number
- **Required**: No
- **Default**: `24`
- **Description**: Minimum hours before appointment for cancellation
- **Example**: `CANCELLATION_HOURS=24`

### AUTO_CANCEL_UNPAID_MINUTES
- **Type**: Number
- **Required**: No
- **Default**: `15`
- **Description**: Minutes after which unpaid bookings are auto-cancelled
- **Example**: `AUTO_CANCEL_UNPAID_MINUTES=15`

---

## Logging

### LOG_LEVEL
- **Type**: String
- **Required**: No
- **Default**: `info`
- **Values**: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`
- **Description**: Minimum log level to record
- **Example**: `LOG_LEVEL=info`
- **Levels Explained**:
  - `error` - Only errors
  - `warn` - Warnings and errors
  - `info` - General information (recommended)
  - `debug` - Detailed debugging information

### LOG_FILE_PATH
- **Type**: String (Directory path)
- **Required**: No
- **Default**: `logs/`
- **Description**: Directory path for log files
- **Example**: `LOG_FILE_PATH=logs/`

---

## Complete Example .env File

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/doctor_appointment_test?retryWrites=true&w=majority

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=doctor-appointment-uploads

# Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYMENT_GATEWAY=razorpay

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@doctorappointment.com

# SMS Configuration (Optional)
SMS_API_KEY=
SMS_SENDER_ID=

# Frontend URLs
FRONTEND_PATIENT_URL=http://localhost:3000
FRONTEND_DOCTOR_URL=http://localhost:3001
FRONTEND_ADMIN_URL=http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# Appointment Configuration
SLOT_DURATION_MINUTES=30
BOOKING_ADVANCE_DAYS=30
CANCELLATION_HOURS=24
AUTO_CANCEL_UNPAID_MINUTES=15

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/
```

---

## Security Best Practices

### 1. Never Commit .env to Version Control
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. Use Strong Secrets
```bash
# Generate strong JWT secrets
openssl rand -base64 32
```

### 3. Different Secrets for Different Environments
- Development: Use test keys
- Staging: Use staging keys
- Production: Use production keys

### 4. Rotate Secrets Regularly
- Change JWT secrets every 3-6 months
- Rotate API keys annually
- Update passwords quarterly

### 5. Use Environment-Specific Files
```
.env.development
.env.staging
.env.production
```

---

## Troubleshooting

### Issue: JWT Token Invalid
**Solution**: Ensure JWT_SECRET is at least 32 characters

### Issue: MongoDB Connection Failed
**Solution**: Check MONGODB_URI format and ensure MongoDB is running

### Issue: Redis Connection Failed
**Solution**: Verify REDIS_HOST, REDIS_PORT, and ensure Redis is running

### Issue: Email Not Sending
**Solution**: 
- For Gmail, use App Password, not regular password
- Check SMTP_HOST and SMTP_PORT
- Verify SMTP_USER and SMTP_PASSWORD

### Issue: Payment Gateway Errors
**Solution**: 
- Verify API keys are correct
- Check if using test keys in development
- Ensure webhook URLs are configured

---

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
MONGODB_URI=mongodb+srv://devuser:devpass@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
REDIS_HOST=localhost
FRONTEND_PATIENT_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://produser:prodpass@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
REDIS_HOST=redis.production.com
REDIS_PASSWORD=strong_password
FRONTEND_PATIENT_URL=https://patient.doctorapp.com
LOG_LEVEL=info
```

### Testing
```env
NODE_ENV=test
MONGODB_URI=mongodb+srv://testuser:testpass@cluster0.xxxxx.mongodb.net/doctor_appointment_test?retryWrites=true&w=majority
REDIS_HOST=localhost
LOG_LEVEL=error
```

---

## Validation

The application validates environment variables on startup. Missing required variables will cause the application to fail with clear error messages.

---

## Support

For questions about environment configuration:
- Check this documentation
- Review .env.example file
- Consult backend/README.md
- Create an issue on GitHub

---

**Last Updated**: January 2024
**Version**: 1.0.0
