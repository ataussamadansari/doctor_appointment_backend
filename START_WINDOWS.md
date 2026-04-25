# 🚀 Quick Start for Windows

## Current Status ✅

Your setup is almost complete:
- ✅ Node.js installed
- ✅ npm packages installed
- ✅ MongoDB Atlas configured
- ✅ .env file configured with secure JWT secrets
- ⚠️ **Redis needs to be installed**

---

## 🎯 Easiest Way to Get Started (3 Options)

### Option 1: Docker (Recommended - 2 minutes)

**If you have Docker Desktop**:

```powershell
# Start Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Start Backend
npm run dev
```

**Don't have Docker?** Download from: https://www.docker.com/products/docker-desktop

---

### Option 2: Memurai (Native Windows - 5 minutes)

1. **Download Memurai** (Free Redis for Windows):
   - Go to: https://www.memurai.com/get-memurai
   - Download Developer Edition
   - Install (it will auto-start)

2. **Start Backend**:
   ```powershell
   npm run dev
   ```

---

### Option 3: Skip Redis for Now (Testing Only)

**For immediate testing without Redis**:

1. **Temporarily disable Redis** in `src/server.js`:
   
   Find these lines (around line 10-15):
   ```javascript
   import redisClient from './config/redis.js';
   ```
   
   Comment it out:
   ```javascript
   // import redisClient from './config/redis.js';
   ```
   
   Find this line (around line 90):
   ```javascript
   redisClient.connect();
   ```
   
   Comment it out:
   ```javascript
   // redisClient.connect();
   // logger.info('✓ Redis connected');
   ```

2. **Start Backend**:
   ```powershell
   npm run dev
   ```

**⚠️ Note**: Without Redis, some features won't work:
- Distributed locking (appointment booking may have race conditions)
- Caching (slower performance)
- Background jobs

---

## 🚀 Start Your Backend Now

### Step 1: Choose Redis Option Above

Pick the easiest option for you (Docker recommended).

### Step 2: Start Backend

```powershell
# Make sure you're in the backend directory
cd D:\Full Stack\Doctor_Appointment\backend

# Start the server
npm run dev
```

### Step 3: Verify It's Running

**You should see**:
```
✓ MongoDB Connected: cluster0-shard-00-00.4lnfp.mongodb.net
✓ Redis connected successfully
✓ Socket.io initialized
✓ Server running on port 5000
✓ Environment: development
✓ API Base URL: http://localhost:5000/api/v1
✓ Health Check: http://localhost:5000/health
```

### Step 4: Test the API

**Open browser**: http://localhost:5000/health

**Or use PowerShell**:
```powershell
curl http://localhost:5000/health
```

**Expected response**:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

---

## 🧪 Test Your First API Call

### Register a User

```powershell
curl -X POST http://localhost:5000/api/v1/auth/register/user `
  -H "Content-Type: application/json" `
  -d '{
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"email\": \"john@example.com\",
    \"phone\": \"9876543210\",
    \"password\": \"password123\",
    \"dateOfBirth\": \"1990-01-15\",
    \"gender\": \"male\"
  }'
```

**Success response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## 🐛 Quick Troubleshooting

### Error: "Cannot find module"

**Solution**:
```powershell
npm install
```

### Error: "Port 5000 is already in use"

**Solution**:
```powershell
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env
# PORT=5001
```

### Error: "Redis connection failed"

**Solution**:
- Make sure Redis/Memurai is running
- Or use Option 3 above (skip Redis temporarily)

### Error: "MongoDB connection failed"

**Solution**:
- Check internet connection
- Verify MongoDB Atlas connection string in .env
- Check if IP is whitelisted in Atlas

---

## 📚 Next Steps

Once your backend is running:

1. **Test all endpoints** using Postman or curl
2. **Read API documentation**: `API_DOCUMENTATION.md`
3. **Install Redis properly** (if you skipped it)
4. **Configure payment gateway** (Razorpay/Stripe)
5. **Set up email service** (Gmail SMTP)
6. **Connect frontend** applications

---

## 💡 Pro Tips

### Use Windows Terminal
- Better than PowerShell
- Multiple tabs
- Download from Microsoft Store

### Use Postman for API Testing
- Download from: https://www.postman.com/downloads/
- Import API collection
- Test all endpoints easily

### View Logs in Real-Time
```powershell
Get-Content logs\application-*.log -Tail 50 -Wait
```

### Auto-Restart on Changes
```powershell
# Already configured with nodemon
npm run dev
```

---

## ✅ Your Setup Summary

**What's Working**:
- ✅ Node.js and npm
- ✅ MongoDB Atlas connection
- ✅ Environment variables configured
- ✅ JWT secrets generated
- ✅ All dependencies installed

**What's Needed**:
- ⚠️ Redis (choose option above)

**Time to Complete**:
- With Docker: 2 minutes
- With Memurai: 5 minutes
- Skip Redis: 0 minutes (but limited functionality)

---

## 🎉 You're Almost There!

**Just install Redis using one of the options above, then run**:

```powershell
npm run dev
```

**That's it! Your backend will be running! 🚀**

---

## 📞 Need Help?

- **Windows Setup**: See `WINDOWS_SETUP.md`
- **MongoDB Atlas**: See `MONGODB_ATLAS_SETUP.md`
- **General Setup**: See `QUICK_START.md`
- **API Reference**: See `API_DOCUMENTATION.md`

---

**Ready? Let's start! 🚀**

Choose a Redis option above and run `npm run dev`!
