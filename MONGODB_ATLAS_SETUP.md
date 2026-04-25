# MongoDB Atlas Setup Guide

Complete guide to setting up MongoDB Atlas for the Doctor Appointment System.

---

## 🌐 What is MongoDB Atlas?

MongoDB Atlas is a fully-managed cloud database service that provides:
- ✅ Free tier (M0) with 512MB storage
- ✅ Automatic backups
- ✅ High availability
- ✅ Global distribution
- ✅ Built-in security
- ✅ No server management required

---

## 🚀 Quick Setup (10 Minutes)

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with:
   - Email and password, OR
   - Google account, OR
   - GitHub account
3. Verify your email address

---

### Step 2: Create a Free Cluster

1. **After login**, click **"Build a Database"**

2. **Choose Deployment Type**:
   - Select **"Shared"** (Free tier)
   - Click **"Create"**

3. **Configure Cluster**:
   - **Cloud Provider**: Choose AWS, Google Cloud, or Azure
   - **Region**: Select closest to your location
   - **Cluster Tier**: M0 Sandbox (FREE)
   - **Cluster Name**: Leave as default or rename (e.g., `Cluster0`)

4. Click **"Create Cluster"** (takes 3-5 minutes)

---

### Step 3: Create Database User

1. **Security Quickstart** will appear automatically

2. **Create Database User**:
   - **Authentication Method**: Password
   - **Username**: Enter username (e.g., `doctorapp_user`)
   - **Password**: Click "Autogenerate Secure Password" or create your own
   - **⚠️ IMPORTANT**: Copy and save the password securely!
   - **Database User Privileges**: Select "Read and write to any database"

3. Click **"Create User"**

---

### Step 4: Configure Network Access

1. **Add IP Address**:
   - Click **"Add My Current IP Address"** (for your development machine)
   - OR click **"Allow Access from Anywhere"** (0.0.0.0/0)
   
   **For Development**: Use 0.0.0.0/0
   **For Production**: Add specific IP addresses

2. Click **"Finish and Close"**

---

### Step 5: Get Connection String

1. Click **"Connect"** button on your cluster

2. Choose **"Connect your application"**

3. **Driver**: Node.js
   **Version**: 4.1 or later

4. **Copy the connection string**:
   ```
   mongodb+srv://doctorapp_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. **Modify the connection string**:
   - Replace `<password>` with your actual password
   - Add database name: `/doctor_appointment` before the `?`
   
   **Final format**:
   ```
   mongodb+srv://doctorapp_user:YourPassword123@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
   ```

---

## 🔧 Configure Your Application

### Update .env File

```bash
# Open your .env file
cd backend
nano .env  # or use your preferred editor
```

### Add Your Connection String

```env
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://doctorapp_user:YourPassword123@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority

# Test database (optional - use different database name)
MONGODB_TEST_URI=mongodb+srv://doctorapp_user:YourPassword123@cluster0.xxxxx.mongodb.net/doctor_appointment_test?retryWrites=true&w=majority
```

---

## ⚠️ Important: URL Encoding Passwords

If your password contains special characters, you must URL encode them:

### Special Characters to Encode

| Character | Encoded |
|-----------|---------|
| @         | %40     |
| :         | %3A     |
| /         | %2F     |
| ?         | %3F     |
| #         | %23     |
| [         | %5B     |
| ]         | %5D     |
| $         | %24     |
| &         | %26     |
| +         | %2B     |
| ,         | %2C     |
| ;         | %3B     |
| =         | %3D     |
| %         | %25     |
| space     | %20     |

### Example

**Original Password**: `MyP@ss:word#123`

**URL Encoded**: `MyP%40ss%3Aword%23123`

**Connection String**:
```
mongodb+srv://username:MyP%40ss%3Aword%23123@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

### Online Tool

Use this tool to encode your password: https://www.urlencoder.org/

---

## ✅ Test Your Connection

### Method 1: Using mongosh (MongoDB Shell)

```bash
# Install mongosh if not already installed
# Download from: https://www.mongodb.com/try/download/shell

# Test connection
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment"

# If successful, you'll see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb+srv://...
# Using MongoDB: 7.0.x
# Using Mongosh: 2.x.x
```

### Method 2: Using Your Application

```bash
# Start your backend
cd backend
npm run dev

# Check logs for successful connection
# You should see: "✓ MongoDB connected"
```

### Method 3: Using MongoDB Compass (GUI)

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Open Compass
3. Paste your connection string
4. Click "Connect"
5. You should see your database and collections

---

## 📊 Create Database and Collections

MongoDB will automatically create the database and collections when you first insert data. However, you can create them manually:

### Using mongosh

```javascript
// Connect to your cluster
mongosh "your-connection-string"

// Switch to database
use doctor_appointment

// Create collections
db.createCollection("users")
db.createCollection("doctors")
db.createCollection("slots")
db.createCollection("appointments")
db.createCollection("payments")
db.createCollection("notifications")

// Verify collections
show collections
```

### Using MongoDB Compass

1. Connect to your cluster
2. Click "Create Database"
3. Database Name: `doctor_appointment`
4. Collection Name: `users`
5. Click "Create Database"

---

## 🔒 Security Best Practices

### 1. Strong Passwords

```bash
# Generate strong password
openssl rand -base64 20

# Or use MongoDB's autogenerate feature
```

### 2. IP Whitelisting

**Development**:
- Use 0.0.0.0/0 (allow from anywhere)

**Production**:
- Add specific IP addresses
- Add your server's IP
- Add your office IP
- Remove 0.0.0.0/0

### 3. Database User Permissions

- Create separate users for different environments
- Use least privilege principle
- Development user: Read/Write
- Production user: Read/Write with specific database
- Backup user: Read only

### 4. Connection String Security

```bash
# ❌ NEVER commit .env to git
# ✅ Add to .gitignore
echo ".env" >> .gitignore

# ❌ NEVER hardcode in source code
# ✅ Always use environment variables

# ❌ NEVER share connection strings
# ✅ Use separate credentials per environment
```

---

## 🌍 Multiple Environments Setup

### Development Environment

```env
# .env.development
MONGODB_URI=mongodb+srv://dev_user:dev_pass@cluster0.xxxxx.mongodb.net/doctor_appointment_dev?retryWrites=true&w=majority
```

### Staging Environment

```env
# .env.staging
MONGODB_URI=mongodb+srv://staging_user:staging_pass@cluster0.xxxxx.mongodb.net/doctor_appointment_staging?retryWrites=true&w=majority
```

### Production Environment

```env
# .env.production
MONGODB_URI=mongodb+srv://prod_user:prod_pass@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

---

## 📈 Monitoring Your Database

### MongoDB Atlas Dashboard

1. **Metrics**:
   - Go to your cluster
   - Click "Metrics" tab
   - View connections, operations, network usage

2. **Real-time Performance**:
   - Click "Real-Time" tab
   - Monitor live queries and operations

3. **Alerts**:
   - Click "Alerts" in left sidebar
   - Set up alerts for:
     - High connection count
     - Low storage space
     - High CPU usage

### Application Monitoring

```javascript
// Your application logs will show:
// ✓ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

---

## 🔄 Backup and Restore

### Automatic Backups (Paid Tiers)

- M10+ clusters have automatic backups
- Free M0 tier does NOT have automatic backups

### Manual Backup (Free Tier)

```bash
# Export database using mongodump
mongodump --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment" --out=./backup

# Restore database using mongorestore
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment" ./backup/doctor_appointment
```

---

## 🐛 Troubleshooting

### Issue 1: Authentication Failed

**Error**: `MongoServerError: bad auth : Authentication failed`

**Solutions**:
1. Check username and password are correct
2. Ensure password is URL encoded
3. Verify user exists in Database Access
4. Check user has correct permissions

### Issue 2: IP Not Whitelisted

**Error**: `MongoServerError: connection attempt failed`

**Solutions**:
1. Go to Network Access in Atlas
2. Add your current IP address
3. Or use 0.0.0.0/0 for development

### Issue 3: Connection Timeout

**Error**: `MongoServerSelectionError: connection timed out`

**Solutions**:
1. Check your internet connection
2. Verify cluster is running (not paused)
3. Check firewall settings
4. Try different network (VPN might block)

### Issue 4: Database Not Found

**Error**: Database doesn't appear in Atlas

**Solution**:
- MongoDB creates database on first write operation
- Insert a document to create the database
- Or create manually in Atlas UI

### Issue 5: Special Characters in Password

**Error**: `Invalid connection string`

**Solution**:
- URL encode special characters in password
- Use the encoding table above
- Or regenerate password without special characters

---

## 📞 Getting Help

### MongoDB Atlas Support

- **Documentation**: https://docs.atlas.mongodb.com/
- **Community Forums**: https://www.mongodb.com/community/forums/
- **Support**: https://support.mongodb.com/ (paid plans)

### Application Support

- Check backend/README.md
- Check backend/QUICK_START.md
- Create an issue on GitHub

---

## ✅ Verification Checklist

After setup, verify:

- [ ] MongoDB Atlas account created
- [ ] Free cluster created and running
- [ ] Database user created with password saved
- [ ] IP address whitelisted (0.0.0.0/0 for dev)
- [ ] Connection string copied and modified
- [ ] Password URL encoded (if needed)
- [ ] Connection string added to .env
- [ ] Database name added to connection string
- [ ] Connection tested with mongosh or Compass
- [ ] Application connects successfully
- [ ] Collections created (automatically or manually)

---

## 🎉 You're All Set!

Your MongoDB Atlas database is now configured and ready to use with the Doctor Appointment System!

**Connection String Format**:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

**Next Steps**:
1. Start your backend: `npm run dev`
2. Check logs for successful connection
3. Test API endpoints
4. Monitor database in Atlas dashboard

---

**Need Help?** Check the troubleshooting section above or refer to the main documentation.
