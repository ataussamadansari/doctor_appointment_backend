import mongoose from 'mongoose';

/**
 * Slot Model
 * Manages doctor availability slots for appointments
 * Implements unique constraint to prevent double booking
 */
const slotSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available',
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    // Unique identifier for slot to prevent double booking
    slotIdentifier: {
      type: String,
      required: true,
      unique: true,
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

// Compound indexes for efficient queries
slotSchema.index({ doctor: 1, date: 1, status: 1 });
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ date: 1, status: 1 });
slotSchema.index({ slotIdentifier: 1 });

// Generate the unique slot identifier before validation so required validation passes.
slotSchema.pre('validate', function (next) {
  if (!this.slotIdentifier) {
    this.slotIdentifier = `${this.doctor}_${this.date.toISOString().split('T')[0]}_${this.startTime}`;
  }
  next();
});

// Static method to find available slots
slotSchema.statics.findAvailableSlots = function (doctorId, startDate, endDate) {
  return this.find({
    doctor: doctorId,
    date: { $gte: startDate, $lte: endDate },
    status: 'available',
    isActive: true,
  }).sort({ date: 1, startTime: 1 });
};

// Static method to check slot availability
slotSchema.statics.isSlotAvailable = async function (slotId) {
  const slot = await this.findById(slotId);
  return slot && slot.status === 'available' && slot.isActive;
};

// Instance method to book slot
slotSchema.methods.book = async function (appointmentId) {
  this.status = 'booked';
  this.appointment = appointmentId;
  return await this.save();
};

// Instance method to release slot
slotSchema.methods.release = async function () {
  this.status = 'available';
  this.appointment = null;
  return await this.save();
};

// Instance method to block slot
slotSchema.methods.block = async function () {
  this.status = 'blocked';
  return await this.save();
};

const Slot = mongoose.model('Slot', slotSchema);

export default Slot;
