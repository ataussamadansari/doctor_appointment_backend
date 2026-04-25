# MongoDB Atlas - Quick Reference Card

Quick reference for MongoDB Atlas setup and common operations.

---

## 🚀 Quick Setup (5 Steps)

```
1. Sign up → https://cloud.mongodb.com/
2. Create Cluster → Choose FREE (M0)
3. Create User → Database Access → Add User
4. Whitelist IP → Network Access → 0.0.0.0/0
5. Get Connection String → Connect → Connect your application
```

---

## 🔗 Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

### Example

```env
MONGODB_URI=mongodb+srv://doctorapp:MyPass123@cluster0.abc123.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

### Replace

- `USERNAME` → Your database username
- `PASSWORD` → Your database password (URL encoded!)
- `CLUSTER` → Your cluster address (e.g., cluster0.abc123)
- `DATABASE` → `doctor_appointment`

---

## ⚠️ URL Encode Password

If password has special characters, encode them:

```
@  → %40
:  → %3A
#  → %23
$  → %24
%  → %25
/  → %2F
?  → %3F
```

**Example**:
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`

**Tool**: https://www.urlencoder.org/

---

## ✅ Test Connection

### Using mongosh

```bash
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment"
```

### Using Node.js

```javascript
const mongoose = require('mongoose');

mongoose.connect('your-connection-string')
  .then(() => console.log('✓ Connected'))
  .catch(err => console.error('✗ Error:', err));
```

### Using MongoDB Compass

1. Download: https://www.mongodb.com/try/download/compass
2. Paste connection string
3. Click Connect

---

## 🔒 Security Checklist

```
✓ Strong password (min 12 characters)
✓ URL encode special characters
✓ IP whitelisted (0.0.0.0/0 for dev)
✓ User has correct permissions
✓ Connection string in .env (not in code)
✓ .env in .gitignore
```

---

## 🐛 Common Errors

### Authentication Failed

```
Error: bad auth : Authentication failed
```

**Fix**:
- Check username/password
- URL encode password
- Verify user exists

### IP Not Whitelisted

```
Error: connection attempt failed
```

**Fix**:
- Network Access → Add IP → 0.0.0.0/0

### Connection Timeout

```
Error: connection timed out
```

**Fix**:
- Check internet connection
- Verify cluster is running
- Try different network

---

## 📊 Database Operations

### Create Collections

```javascript
// Collections are created automatically on first insert
// Or create manually:

use doctor_appointment

db.createCollection("users")
db.createCollection("doctors")
db.createCollection("slots")
db.createCollection("appointments")
db.createCollection("payments")
db.createCollection("notifications")
```

### View Data

```javascript
// Show all collections
show collections

// Count documents
db.users.countDocuments()

// Find all users
db.users.find().pretty()

// Find one user
db.users.findOne({ email: "john@example.com" })
```

---

## 🔄 Backup & Restore

### Export Database

```bash
mongodump --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment" --out=./backup
```

### Import Database

```bash
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doctor_appointment" ./backup/doctor_appointment
```

---

## 📈 Monitoring

### Atlas Dashboard

```
1. Go to cloud.mongodb.com
2. Select your cluster
3. Click "Metrics" tab
4. View:
   - Connections
   - Operations
   - Network
   - Storage
```

### Set Up Alerts

```
1. Click "Alerts" in sidebar
2. Click "Add Alert"
3. Choose metric (e.g., connections > 100)
4. Add email notification
```

---

## 🌍 Multiple Environments

### Development

```env
MONGODB_URI=mongodb+srv://dev_user:dev_pass@cluster0.xxxxx.mongodb.net/doctor_appointment_dev?retryWrites=true&w=majority
```

### Production

```env
MONGODB_URI=mongodb+srv://prod_user:prod_pass@cluster0.xxxxx.mongodb.net/doctor_appointment?retryWrites=true&w=majority
```

---

## 📞 Quick Links

- **Atlas Dashboard**: https://cloud.mongodb.com/
- **Documentation**: https://docs.atlas.mongodb.com/
- **mongosh Download**: https://www.mongodb.com/try/download/shell
- **Compass Download**: https://www.mongodb.com/try/download/compass
- **URL Encoder**: https://www.urlencoder.org/
- **Support**: https://support.mongodb.com/

---

## 💡 Pro Tips

1. **Use separate users for each environment**
2. **Enable 2FA on your Atlas account**
3. **Set up alerts for high connection count**
4. **Use MongoDB Compass for visual database management**
5. **Keep connection strings in .env, never in code**
6. **URL encode passwords with special characters**
7. **Use specific IPs in production (not 0.0.0.0/0)**
8. **Monitor your free tier usage (512MB limit)**

---

## 🎯 Quick Commands

```bash
# Test connection
mongosh "your-connection-string"

# Show databases
show dbs

# Use database
use doctor_appointment

# Show collections
show collections

# Count documents
db.users.countDocuments()

# Find all
db.users.find()

# Find one
db.users.findOne()

# Exit
exit
```

---

**For detailed setup**: See [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)

**For troubleshooting**: See [QUICK_START.md](QUICK_START.md)
