import mongoose from 'mongoose';

/**
 * Appointment Model
 * Manages appointment bookings with state machine pattern
 */
const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      required: true,
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
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot reference is required'],
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
    },
    symptoms: {
      type: String,
      maxlength: [500, 'Symptoms description cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    prescription: {
      medicines: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        },
      ],
      diagnosis: String,
      advice: String,
      followUpDate: Date,
      documents: [String],
    },
    cancellationReason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin', 'system'],
    },
    cancelledAt: Date,
    completedAt: Date,
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      ratedAt: Date,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ paymentStatus: 1 });
appointmentSchema.index({ appointmentNumber: 1 });
appointmentSchema.index({ createdAt: -1 });

// Compound index for queries
appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  status: 1,
});

// Generate appointment number before validation so required validation passes.
appointmentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.appointmentNumber) {
    const count = await mongoose.model('Appointment').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const number = (count + 1).toString().padStart(6, '0');
    this.appointmentNumber = `APT${year}${month}${number}`;
  }
  next();
});

// Static method to get upcoming appointments
appointmentSchema.statics.getUpcomingAppointments = function (userId, userType) {
  const query = {
    [userType]: userId,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
    isActive: true,
  };

  return this.find(query)
    .populate('patient', 'firstName lastName email phone profileImage')
    .populate('doctor', 'firstName lastName specialization profileImage consultationFee')
    .populate('slot')
    .sort({ appointmentDate: 1 });
};

// Static method to get past appointments
appointmentSchema.statics.getPastAppointments = function (userId, userType) {
  const query = {
    [userType]: userId,
    status: { $in: ['completed', 'cancelled', 'no-show'] },
    isActive: true,
  };

  return this.find(query)
    .populate('patient', 'firstName lastName email phone profileImage')
    .populate('doctor', 'firstName lastName specialization profileImage consultationFee')
    .populate('slot')
    .sort({ appointmentDate: -1 });
};

// Instance method to confirm appointment
appointmentSchema.methods.confirm = async function () {
  this.status = 'confirmed';
  return await this.save();
};

// Instance method to cancel appointment
appointmentSchema.methods.cancel = async function (reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  return await this.save();
};

// Instance method to complete appointment
appointmentSchema.methods.complete = async function () {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Instance method to mark as no-show
appointmentSchema.methods.markNoShow = async function () {
  this.status = 'no-show';
  return await this.save();
};

// Instance method to add rating
appointmentSchema.methods.addRating = async function (score, review) {
  this.rating = {
    score,
    review,
    ratedAt: new Date(),
  };
  return await this.save();
};

// Check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  const cancellationHours = parseInt(process.env.CANCELLATION_HOURS || 24);
  
  return (
    ['pending', 'confirmed'].includes(this.status) &&
    hoursDifference >= cancellationHours
  );
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
