import mongoose from 'mongoose';

/**
 * Payment Model
 * Handles payment transactions for appointments
 */
const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'cash'],
      required: true,
    },
    gatewayOrderId: {
      type: String,
    },
    gatewayPaymentId: {
      type: String,
    },
    gatewaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
    },
    refund: {
      refundId: String,
      amount: Number,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
      },
      initiatedAt: Date,
      completedAt: Date,
    },
    metadata: {
      type: Map,
      of: String,
    },
    failureReason: String,
    paidAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ doctor: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Generate transaction IDs before validation so required validation passes.
paymentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.transactionId) {
    const count = await mongoose.model('Payment').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const number = (count + 1).toString().padStart(8, '0');
    this.transactionId = `TXN${year}${month}${number}`;
  }
  next();
});

// Instance method to mark payment as success
paymentSchema.methods.markSuccess = async function (paymentDetails) {
  this.status = 'success';
  this.gatewayPaymentId = paymentDetails.paymentId;
  this.gatewaySignature = paymentDetails.signature;
  this.paymentMethod = paymentDetails.method;
  this.paidAt = new Date();
  return await this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markFailed = async function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return await this.save();
};

// Instance method to initiate refund
paymentSchema.methods.initiateRefund = async function (amount, reason) {
  this.refund = {
    amount: amount || this.amount,
    reason,
    status: 'pending',
    initiatedAt: new Date(),
  };
  return await this.save();
};

// Instance method to complete refund
paymentSchema.methods.completeRefund = async function (refundId) {
  if (!this.refund) {
    throw new Error('No refund initiated');
  }
  this.status = 'refunded';
  this.refund.refundId = refundId;
  this.refund.status = 'completed';
  this.refund.completedAt = new Date();
  return await this.save();
};

// Static method to get total earnings for a doctor
paymentSchema.statics.getDoctorEarnings = async function (doctorId, startDate, endDate) {
  const match = {
    doctor: new mongoose.Types.ObjectId(doctorId),
    status: 'success',
  };

  if (startDate && endDate) {
    match.paidAt = { $gte: startDate, $lte: endDate };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalEarnings: 0, totalTransactions: 0 };
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function (startDate, endDate) {
  const match = {};
  
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
