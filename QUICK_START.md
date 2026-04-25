# Quick Start Guide - Doctor Appointment System Backend

Get your Doctor Appointment System backend up and running in minutes!

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** (Free tier available) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Redis** (v7 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

### Check Installations

```bash
node --version  # Should be v18+
npm --version
redis-server --version
```

### Set Up MongoDB Atlas (5 minutes)

1. **Create Account**: Go to https://cloud.mongodb.com/ and sign up
2. **Create Cluster**: 
   - Click "Build a Database"
   - Choose "FREE" (M0) tier
   - Select your preferred region
   - Click "Create Cluster"
3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set role to "Read and write to any database"
4. **Whitelist IP Address**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, add specific IPs
5. **Get Connection String**:
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone and Install

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Minimum required configuration
NODE_ENV=development
PORT=5000

# MongoDB Atlas (REQUIRED - Replace with your connection string)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority

# Important: Replace the following in your connection string:
# - username: Your MongoDB Atlas username
# - password: Your MongoDB Atlas password (URL encode special characters)
# - cluster0.xxxxx: Your actual cluster address

# Redis (use default if running locally)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Frontend URLs
FRONTEND_PATIENT_URL=http://localhost:3000
FRONTEND_DOCTOR_URL=http://localhost:3001
FRONTEND_ADMIN_URL=http://localhost:3002
```

**Important**: 
- Replace the MongoDB Atlas connection string with your actual credentials
- If your password contains special characters, URL encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `:` → `%3A`

### Step 3: Start Services

#### Option A: Using Docker (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Note**: MongoDB Atlas is used (cloud database), so only Redis and the backend run in Docker.

#### Option B: Manual Start

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Backend:**
```bash
npm run dev
```

**Terminal 3 - Worker (Optional):**
```bash
npm run worker
```

**Note**: No need to start MongoDB locally - using MongoDB Atlas cloud database.

### Step 4: Verify Installation

Open your browser or use curl:

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {
#   "success": true,
#   "message": "Server is healthy",
#   ...
# }
```

---

## 🎯 First API Calls

### 1. Register a Patient

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
  }'
```

**Save the `accessToken` from the response!**

### 2. Register a Doctor

```bash
curl -X POST http://localhost:5000/api/v1/auth/register/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Dr. Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "9876543211",
    "password": "password123",
    "dateOfBirth": "1985-05-20",
    "gender": "female",
    "specialization": "Cardiologist",
    "registrationNumber": "MED123456",
    "experience": 10,
    "consultationFee": 500,
    "clinicAddress": {
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Get Your Profile

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Development Workflow

### Running in Development Mode

```bash
# Start with auto-reload
npm run dev

# The server will restart automatically when you make changes
```

### Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis configuration
│   ├── models/          # MongoDB models
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # API routes
│   ├── sockets/         # Socket.io handlers
│   ├── workers/         # Background jobs
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json
```

### Adding a New Feature

1. **Create Model** (if needed)
   ```javascript
   // src/models/YourModel.js
   ```

2. **Create Service**
   ```javascript
   // src/services/yourService.js
   ```

3. **Create Controller**
   ```javascript
   // src/controllers/yourController.js
   ```

4. **Create Routes**
   ```javascript
   // src/routes/yourRoutes.js
   ```

5. **Register Routes in server.js**
   ```javascript
   import yourRoutes from './routes/yourRoutes.js';
   app.use(`${API_PREFIX}/your-endpoint`, yourRoutes);
   ```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Manual API Testing

Use tools like:
- **Postman** - GUI-based API testing
- **Insomnia** - Alternative to Postman
- **cURL** - Command-line testing
- **Thunder Client** - VS Code extension

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
tail -f logs/application-2024-01-15.log

# Error logs only
tail -f logs/error-2024-01-15.log
```

### Check Database

```bash
# Connect to MongoDB Atlas using mongosh
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/doctor_appointment" --username your-username

# Or use MongoDB Compass (GUI)
# Download from: https://www.mongodb.com/try/download/compass
# Connect using your MongoDB Atlas connection string

# View collections
show collections

# Query users
db.users.find().pretty()
```

### Check Redis

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get a value
GET key_name

# Monitor commands
MONITOR
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=5001
```

### MongoDB Connection Failed

```bash
# Check your MongoDB Atlas connection string
# Ensure:
# 1. Username and password are correct
# 2. Password special characters are URL encoded
# 3. IP address is whitelisted (0.0.0.0/0 for development)
# 4. Database user has proper permissions

# Test connection using mongosh
mongosh "your-connection-string"

# Check connection string format in .env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Common Issues**:
- **Authentication failed**: Check username/password
- **IP not whitelisted**: Add your IP in MongoDB Atlas Network Access
- **Special characters in password**: URL encode them (@ → %40, # → %23, etc.)
- **Wrong database name**: Ensure it's `doctor_appointment`

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it
redis-server

# Check Redis config in .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### JWT Errors

```bash
# Ensure JWT secrets are set in .env
JWT_SECRET=your-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Secrets must be at least 32 characters long
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domains
- [ ] Set up MongoDB authentication
- [ ] Set up Redis password
- [ ] Review rate limits
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📚 Next Steps

1. **Read Full Documentation**
   - [README.md](./README.md) - Complete project documentation
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

2. **Set Up Payment Gateway**
   - Get Razorpay/Stripe credentials
   - Configure webhook URLs
   - Test payment flow

3. **Configure Email Service**
   - Set up SMTP credentials
   - Test email sending
   - Customize email templates

4. **Set Up Frontend**
   - Navigate to frontend directory
   - Follow frontend setup guide
   - Connect to backend API

5. **Deploy to Production**
   - Choose hosting provider (AWS, DigitalOcean, Heroku)
   - Set up CI/CD pipeline
   - Configure domain and SSL
   - Set up monitoring and alerts

---

## 💡 Useful Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm run worker           # Start background worker

# Production
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
docker-compose ps        # Check status

# Database
mongosh "your-mongodb-atlas-connection-string"  # MongoDB Atlas shell
redis-cli                # Redis CLI

# Logs
tail -f logs/*.log       # View all logs
```

---

## 🆘 Getting Help

- **Documentation**: Check README.md and API_DOCUMENTATION.md
- **Issues**: Create an issue on GitHub
- **Email**: support@doctorappointment.com
- **Community**: Join our Discord/Slack

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Can register a user
- [ ] Can login
- [ ] Can register a doctor
- [ ] MongoDB Atlas connection works
- [ ] Redis connection works
- [ ] Logs are being created
- [ ] API endpoints respond correctly

---

## 🎉 You're All Set!

Your Doctor Appointment System backend is now running!

**Default URLs:**
- API: http://localhost:5000
- Health Check: http://localhost:5000/health
- API Base: http://localhost:5000/api/v1

**Next:** Set up the frontend applications to complete the system.

Happy coding! 🚀
