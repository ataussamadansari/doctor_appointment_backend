# Windows Setup Guide

Complete guide for setting up the Doctor Appointment System on Windows.

---

## 🪟 Windows-Specific Setup

### Option 1: Install Redis on Windows (Recommended)

#### Using WSL2 (Windows Subsystem for Linux)

1. **Install WSL2**:
   ```powershell
   wsl --install
   ```

2. **Install Ubuntu from Microsoft Store**

3. **Open Ubuntu terminal and install Redis**:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

4. **Test Redis**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

#### Using Memurai (Native Windows Redis)

1. **Download Memurai** (Redis for Windows):
   - Go to: https://www.memurai.com/get-memurai
   - Download Memurai Developer Edition (Free)

2. **Install Memurai**:
   - Run the installer
   - Follow installation wizard
   - Memurai will start automatically as a Windows service

3. **Test Memurai**:
   ```powershell
   memurai-cli ping
   # Should return: PONG
   ```

4. **Update .env**:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

---

### Option 2: Use Docker for Redis (Easiest)

1. **Install Docker Desktop for Windows**:
   - Download from: https://www.docker.com/products/docker-desktop

2. **Start Redis container**:
   ```powershell
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

3. **Test Redis**:
   ```powershell
   docker exec -it redis redis-cli ping
   # Should return: PONG
   ```

4. **Stop Redis** (when needed):
   ```powershell
   docker stop redis
   ```

5. **Start Redis** (after stopping):
   ```powershell
   docker start redis
   ```

---

### Option 3: Run Without Redis (Development Only)

For initial testing, you can run without Redis by modifying the code:

1. **Comment out Redis in server.js** (temporary):
   ```javascript
   // import redisClient from './config/redis.js';
   
   // In startServer function:
   // redisClient.connect();
   // logger.info('✓ Redis connected');
   ```

2. **Start backend**:
   ```powershell
   npm run dev
   ```

**Note**: This is only for initial testing. Redis is required for:
- Distributed locking (prevents double booking)
- Caching
- Session management
- Background jobs

---

## 🚀 Complete Windows Setup Steps

### Step 1: Install Prerequisites

1. **Node.js**:
   - Download from: https://nodejs.org/
   - Install LTS version (18.x or higher)
   - Verify: `node --version`

2. **Git**:
   - Download from: https://git-scm.com/
   - Install with default options
   - Verify: `git --version`

3. **MongoDB Atlas**:
   - Already configured in your .env ✅
   - Connection string is set ✅

4. **Redis** (Choose one option above):
   - WSL2 + Redis
   - Memurai
   - Docker
   - Or skip for initial testing

---

### Step 2: Clone and Install

```powershell
# Navigate to backend directory
cd D:\Full Stack\Doctor_Appointment\backend

# Install dependencies (already done ✅)
npm install
```

---

### Step 3: Configure Environment

Your `.env` file is already configured! ✅

**Verify these settings**:
```env
MONGODB_URI=mongodb+srv://aradhyatech001:...@cluster0.4lnfp.mongodb.net/doctor_appointment?retryWrites=true&w=majority
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=8K7mN2pQ5rT9vX3wZ6yB4cF1gH8jL0nM5pR7sU2vY4zA6bD9eG1hJ3kM6nP8qS0t
```

---

### Step 4: Start Redis

**If using WSL2**:
```powershell
wsl
sudo service redis-server start
redis-cli ping
```

**If using Memurai**:
- Memurai runs automatically as a Windows service
- Test: `memurai-cli ping`

**If using Docker**:
```powershell
docker start redis
```

---

### Step 5: Start Backend

```powershell
# In backend directory
npm run dev
```

**Expected output**:
```
✓ MongoDB Connected: cluster0-shard-00-00.4lnfp.mongodb.net
✓ Redis connected successfully
✓ Socket.io initialized
✓ Server running on port 5000
✓ Environment: development
✓ API Base URL: http://localhost:5000/api/v1
```

---

### Step 6: Test API

**Open new PowerShell window**:

```powershell
# Test health endpoint
curl http://localhost:5000/health

# Or use browser
# Navigate to: http://localhost:5000/health
```

---

## 🧪 Testing the System

### Test 1: Register a User

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

### Test 2: Login

```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"john@example.com\",
    \"password\": \"password123\"
  }'
```

---

## 🐛 Windows-Specific Troubleshooting

### Issue: Port 5000 Already in Use

**Solution**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Issue: Redis Connection Failed

**Solution 1 - Check if Redis is running**:
```powershell
# WSL2
wsl
sudo service redis-server status

# Docker
docker ps | findstr redis

# Memurai
Get-Service Memurai
```

**Solution 2 - Start Redis**:
```powershell
# WSL2
wsl
sudo service redis-server start

# Docker
docker start redis

# Memurai (should auto-start)
Start-Service Memurai
```

### Issue: MongoDB Connection Failed

**Check**:
1. Internet connection is active
2. MongoDB Atlas IP whitelist includes your IP
3. Connection string in .env is correct
4. Password doesn't have unencoded special characters

### Issue: npm Scripts Not Working

**Solution**:
```powershell
# Use npx to run scripts
npx nodemon src/server.js

# Or run directly
node src/server.js
```

---

## 📝 Recommended Tools for Windows

### 1. Windows Terminal
- Download from Microsoft Store
- Better terminal experience
- Supports multiple tabs

### 2. Postman
- Download from: https://www.postman.com/downloads/
- For testing API endpoints
- Import API collection

### 3. MongoDB Compass
- Download from: https://www.mongodb.com/try/download/compass
- GUI for MongoDB Atlas
- View and manage data

### 4. Redis Insight (Optional)
- Download from: https://redis.com/redis-enterprise/redis-insight/
- GUI for Redis
- Monitor cache and data

### 5. VS Code Extensions
- REST Client
- Thunder Client
- MongoDB for VS Code
- Docker

---

## 🚀 Quick Start Commands (Windows)

```powershell
# Start Redis (choose one)
wsl sudo service redis-server start  # WSL2
docker start redis                    # Docker
# Memurai starts automatically

# Start Backend
cd D:\Full Stack\Doctor_Appointment\backend
npm run dev

# Test API (new terminal)
curl http://localhost:5000/health

# View logs
Get-Content logs\application-*.log -Tail 50 -Wait
```

---

## 🔄 Daily Development Workflow

### Morning Startup

```powershell
# 1. Start Redis
docker start redis  # or WSL/Memurai

# 2. Start Backend
cd D:\Full Stack\Doctor_Appointment\backend
npm run dev

# 3. Open browser
start http://localhost:5000/health
```

### Evening Shutdown

```powershell
# 1. Stop backend (Ctrl+C in terminal)

# 2. Stop Redis (optional)
docker stop redis  # if using Docker
```

---

## 📊 Performance Tips for Windows

1. **Exclude from Windows Defender**:
   - Add `node_modules` folder to exclusions
   - Speeds up npm install and file operations

2. **Use SSD**:
   - Store project on SSD for better performance

3. **Close Unnecessary Apps**:
   - Free up RAM for Node.js and MongoDB

4. **Use WSL2 for Better Performance**:
   - Linux tools run faster in WSL2
   - Better for Redis and other services

---

## ✅ Windows Setup Checklist

- [ ] Node.js installed and verified
- [ ] Git installed
- [ ] MongoDB Atlas configured
- [ ] Redis installed (WSL2/Memurai/Docker)
- [ ] Dependencies installed (`npm install`)
- [ ] .env file configured
- [ ] Redis running
- [ ] Backend starts successfully
- [ ] Health check returns success
- [ ] Can register user
- [ ] Can login

---

## 📞 Need Help?

### Windows-Specific Issues
- Check Windows Firewall settings
- Verify antivirus isn't blocking Node.js
- Run PowerShell as Administrator if needed

### General Issues
- Check main documentation
- Review error logs
- Test each component separately

---

**Your Windows setup is ready! 🎉**

**Current Status**:
- ✅ Node.js installed
- ✅ Dependencies installed
- ✅ MongoDB Atlas configured
- ⚠️ Redis needs to be installed (choose option above)
- ✅ .env configured

**Next Step**: Install Redis using one of the options above, then run `npm run dev`
