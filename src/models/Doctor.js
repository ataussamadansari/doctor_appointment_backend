import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Doctor Model
 * Handles doctor profiles, qualifications, and availability
 */
const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Pediatrician',
        'Gynecologist',
        'Orthopedic',
        'Neurologist',
        'Psychiatrist',
        'Dentist',
        'ENT Specialist',
        'Ophthalmologist',
        'Urologist',
        'Gastroenterologist',
        'Endocrinologist',
        'Oncologist',
        'Radiologist',
        'Anesthesiologist',
        'Pulmonologist',
        'Nephrologist',
        'Rheumatologist',
      ],
    },
    qualifications: [
      {
        degree: {
          type: String,
          required: true,
        },
        institution: {
          type: String,
          required: true,
        },
        year: {
          type: Number,
          required: true,
        },
      },
    ],
    registrationNumber: {
      type: String,
      required: [true, 'Medical registration number is required'],
      unique: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    about: {
      type: String,
      maxlength: [1000, 'About section cannot exceed 1000 characters'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    clinicAddress: {
      clinicName: String,
      street: String,
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    availability: [
      {
        dayOfWeek: {
          type: Number,
          required: true,
          min: 0,
          max: 6, // 0 = Sunday, 6 = Saturday
        },
        slots: [
          {
            startTime: {
              type: String,
              required: true,
              match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
            },
            endTime: {
              type: String,
              required: true,
              match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
            },
          },
        ],
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalAppointments: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAvailableForBooking: {
      type: Boolean,
      default: true,
    },
    verificationDocuments: [
      {
        documentType: String,
        documentUrl: String,
        uploadedAt: Date,
      },
    ],
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    role: {
      type: String,
      default: 'doctor',
    },
    lastLogin: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ 'clinicAddress.city': 1 });
doctorSchema.index({ 'clinicAddress.state': 1 });
doctorSchema.index({ isVerified: 1, isActive: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ createdAt: -1 });

// Compound index for search
doctorSchema.index({
  specialization: 1,
  'clinicAddress.city': 1,
  isVerified: 1,
  isActive: 1,
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
doctorSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Hash password before saving
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after JWT was issued
doctorSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Remove sensitive data from JSON output
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.bankDetails;
  delete obj.__v;
  return obj;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
