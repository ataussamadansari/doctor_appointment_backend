import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

console.log('Testing Email Configuration...\n');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Verifying connection...\n');

transporter.verify()
  .then(() => {
    console.log('✅ Email service connected successfully!');
    console.log('Ready to send emails.');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Email service connection failed:');
    console.log('Error:', error.message);
    console.log('\nFull error:', error);
    process.exit(1);
  });
