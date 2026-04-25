import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing MongoDB Atlas Connection...\n');
console.log('Connection String:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
console.log('');

const uri = process.env.MONGODB_URI;

console.log('⏳ Attempting to connect...\n');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Atlas connected successfully!');
    console.log('📊 Connection Details:');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Ready State:', mongoose.connection.readyState);
    console.log('');
    console.log('🎉 Your MongoDB Atlas is working perfectly!');
    console.log('');
    console.log('Next step: Run "npm run dev" to start your backend');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILED! Could not connect to MongoDB Atlas\n');
    console.error('Error:', err.message);
    console.error('');
    console.error('🔧 Common Solutions:');
    console.error('');
    console.error('1. WHITELIST YOUR IP ADDRESS:');
    console.error('   → Go to: https://cloud.mongodb.com/');
    console.error('   → Network Access → Add IP Address');
    console.error('   → Choose "Allow Access from Anywhere" (0.0.0.0/0)');
    console.error('   → Wait 1-2 minutes');
    console.error('');
    console.error('2. CHECK YOUR INTERNET CONNECTION:');
    console.error('   → Make sure you\'re connected to the internet');
    console.error('   → Try: ping google.com');
    console.error('');
    console.error('3. VERIFY CLUSTER IS RUNNING:');
    console.error('   → Go to MongoDB Atlas dashboard');
    console.error('   → Check cluster status (should be "Active")');
    console.error('');
    console.error('4. CHECK FIREWALL:');
    console.error('   → Windows Firewall might be blocking Node.js');
    console.error('   → Allow Node.js through firewall');
    console.error('');
    console.error('5. TRY DIFFERENT NETWORK:');
    console.error('   → Try mobile hotspot');
    console.error('   → Disable VPN if using one');
    console.error('');
    console.error('📖 For detailed help, see: MONGODB_CONNECTION_FIX.md');
    console.error('');
    process.exit(1);
  });
