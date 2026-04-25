# MongoDB Atlas Connection Fix

## 🔴 Error: querySrv ECONNREFUSED

This error means your computer cannot connect to MongoDB Atlas. Here's how to fix it:

---

## ✅ Solution Steps

### Step 1: Whitelist Your IP Address in MongoDB Atlas

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Login** to your account
3. **Select your project**
4. **Click "Network Access"** in the left sidebar
5. **Click "Add IP Address"**
6. **Choose one**:
   - **"Add Current IP Address"** (recommended for development)
   - **"Allow Access from Anywhere"** (0.0.0.0/0) - easier but less secure

7. **Click "Confirm"**
8. **Wait 1-2 minutes** for changes to take effect

---

### Step 2: Verify Your Connection String

Your current connection string:
```
mongodb+srv://aradhyatech001:r4AtSJV8z6by84ma@cluster0.4lnfp.mongodb.net/doctor_appointment
```

**Check these**:
1. ✅ Username: `aradhyatech001`
2. ✅ Password: `r4AtSJV8z6by84ma`
3. ✅ Cluster: `cluster0.4lnfp.mongodb.net`
4. ✅ Database: `doctor_appointment`

**To verify in MongoDB Atlas**:
1. Go to your cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Compare the connection string

---

### Step 3: Test Connection with mongosh

**Install mongosh** (if not installed):
- Download from: https://www.mongodb.com/try/download/shell

**Test connection**:
```powershell
mongosh "mongodb+srv://aradhyatech001:r4AtSJV8z6by84ma@cluster0.4lnfp.mongodb.net/doctor_appointment"
```

**If successful**, you'll see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb+srv://...
Using MongoDB: 7.0.x
```

**If failed**, check:
- Internet connection
- Firewall settings
- VPN (try disabling)
- Antivirus (may block connection)

---

### Step 4: Check Windows Firewall

**Allow Node.js through firewall**:

1. Open **Windows Defender Firewall**
2. Click **"Allow an app through firewall"**
3. Click **"Change settings"**
4. Find **"Node.js"** in the list
5. Check both **Private** and **Public**
6. Click **OK**

---

### Step 5: Try Alternative Connection Method

If DNS resolution fails, try using the **standard connection string** instead of SRV:

**Get standard connection string from Atlas**:
1. Go to your cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Click "Connection String Only"
5. Select "Standard Connection String"

**Update .env**:
```env
MONGODB_URI=mongodb://aradhyatech001:r4AtSJV8z6by84ma@cluster0-shard-00-00.4lnfp.mongodb.net:27017,cluster0-shard-00-01.4lnfp.mongodb.net:27017,cluster0-shard-00-02.4lnfp.mongodb.net:27017/doctor_appointment?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

---

### Step 6: Check Internet Connection

**Test DNS resolution**:
```powershell
nslookup cluster0.4lnfp.mongodb.net
```

**Expected output**:
```
Server: ...
Address: ...

Non-authoritative answer:
Name: cluster0.4lnfp.mongodb.net
Addresses: ...
```

**If DNS fails**:
- Check internet connection
- Try different network (mobile hotspot)
- Disable VPN
- Flush DNS cache:
  ```powershell
  ipconfig /flushdns
  ```

---

### Step 7: Verify Cluster is Running

1. Go to MongoDB Atlas
2. Check your cluster status
3. Should show **"Active"** or **"Running"**
4. If paused, click **"Resume"**

---

## 🔧 Quick Fix Commands

### Option 1: Whitelist All IPs (Development Only)

1. MongoDB Atlas → Network Access
2. Add IP Address → 0.0.0.0/0
3. Wait 1-2 minutes
4. Restart backend: `npm run dev`

### Option 2: Flush DNS and Retry

```powershell
# Flush DNS cache
ipconfig /flushdns

# Restart backend
npm run dev
```

### Option 3: Use Different Network

- Try mobile hotspot
- Try different WiFi
- Disable VPN

---

## 🧪 Test Your Connection

### Test 1: Ping MongoDB Atlas

```powershell
ping cluster0.4lnfp.mongodb.net
```

### Test 2: Test with mongosh

```powershell
mongosh "mongodb+srv://aradhyatech001:r4AtSJV8z6by84ma@cluster0.4lnfp.mongodb.net/test"
```

### Test 3: Test with Node.js

Create `test-connection.js`:
```javascript
import mongoose from 'mongoose';

const uri = 'mongodb+srv://aradhyatech001:r4AtSJV8z6by84ma@cluster0.4lnfp.mongodb.net/doctor_appointment?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
```

Run:
```powershell
node test-connection.js
```

---

## 🐛 Common Issues

### Issue 1: IP Not Whitelisted

**Error**: `querySrv ECONNREFUSED`

**Fix**: Add your IP in MongoDB Atlas Network Access

### Issue 2: Wrong Password

**Error**: `Authentication failed`

**Fix**: 
1. Go to MongoDB Atlas → Database Access
2. Edit user
3. Reset password
4. Update .env file

### Issue 3: Firewall Blocking

**Error**: Connection timeout

**Fix**: 
- Allow Node.js through Windows Firewall
- Disable antivirus temporarily
- Try different network

### Issue 4: VPN Interference

**Error**: DNS resolution fails

**Fix**: Disable VPN and try again

### Issue 5: Cluster Paused

**Error**: Connection refused

**Fix**: Resume cluster in MongoDB Atlas

---

## ✅ Checklist

After fixing, verify:

- [ ] IP whitelisted in MongoDB Atlas (0.0.0.0/0 for dev)
- [ ] Cluster is active/running
- [ ] Connection string is correct in .env
- [ ] Internet connection is working
- [ ] Firewall allows Node.js
- [ ] VPN is disabled (if causing issues)
- [ ] DNS resolves cluster address
- [ ] mongosh can connect
- [ ] Backend starts without errors

---

## 🎯 Most Common Fix

**90% of the time, this is the issue**:

1. Go to: https://cloud.mongodb.com/
2. Network Access → Add IP Address
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Wait 2 minutes
5. Run: `npm run dev`

**That's it!** ✅

---

## 📞 Still Not Working?

### Try This:

1. **Screenshot your error**
2. **Check MongoDB Atlas cluster status**
3. **Verify IP whitelist settings**
4. **Try mobile hotspot**
5. **Contact MongoDB Atlas support**

### Alternative: Use Local MongoDB

If Atlas continues to fail, you can temporarily use local MongoDB:

```powershell
# Install MongoDB locally
# Download from: https://www.mongodb.com/try/download/community

# Update .env
MONGODB_URI=mongodb://localhost:27017/doctor_appointment

# Start MongoDB
mongod

# Start backend
npm run dev
```

---

**Most likely fix: Whitelist your IP in MongoDB Atlas Network Access! 🎯**
