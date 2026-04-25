import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Payment from '../models/Payment.js';
import Slot from '../models/Slot.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { AppError } from '../utils/errors.js';
import { ApiResponse } from '../utils/response.js';

const DEFAULT_LIMIT = 10;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDateBounds = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { start, end };
};

const getDoctorSort = (sortBy) => {
  switch (sortBy) {
    case 'experience':
      return { experience: -1, 'rating.average': -1 };
    case 'fee_low':
      return { consultationFee: 1, 'rating.average': -1 };
    case 'fee_high':
      return { consultationFee: -1, 'rating.average': -1 };
    case 'rating':
    default:
      return { 'rating.average': -1, isVerified: -1, totalAppointments: -1 };
  }
};

const toSlotResponse = (slot) => ({
  ...slot.toObject(),
  isBooked: slot.status === 'booked',
  isAvailable: slot.status === 'available' && slot.isActive,
});

const ensureSlotsForDate = async (doctor, dateString) => {
  const { start, end } = getDateBounds(dateString);
  const existingSlots = await Slot.find({
    doctor: doctor._id,
    date: { $gte: start, $lte: end },
    isActive: true,
  }).sort({ startTime: 1 });

  if (existingSlots.length > 0) {
    return existingSlots;
  }

  const dayOfWeek = start.getUTCDay();
  const availabilityForDay = (doctor.availability || []).find(
    (entry) => entry.dayOfWeek === dayOfWeek
  );

  if (!availabilityForDay || !availabilityForDay.slots?.length) {
    return [];
  }

  const createdSlots = [];
  for (const slotDef of availabilityForDay.slots) {
    const slotIdentifier = `${doctor._id}_${dateString}_${slotDef.startTime}`;
    const slot = await Slot.findOneAndUpdate(
      {
        doctor: doctor._id,
        date: start,
        startTime: slotDef.startTime,
      },
      {
        $setOnInsert: {
          endTime: slotDef.endTime,
          status: 'available',
          slotIdentifier,
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    createdSlots.push(slot);
  }

  return createdSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const getDoctors = catchAsync(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
  const skip = (page - 1) * limit;

  const filters = {
    isActive: true,
    isAvailableForBooking: true,
  };

  if (req.query.specialization) {
    filters.specialization = req.query.specialization;
  }
  if (req.query.city) {
    filters['clinicAddress.city'] = new RegExp(req.query.city, 'i');
  }
  if (req.query.minFee || req.query.maxFee) {
    filters.consultationFee = {};
    if (req.query.minFee) {
      filters.consultationFee.$gte = Number(req.query.minFee);
    }
    if (req.query.maxFee) {
      filters.consultationFee.$lte = Number(req.query.maxFee);
    }
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filters.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { specialization: searchRegex },
      { 'clinicAddress.city': searchRegex },
      { 'clinicAddress.state': searchRegex },
    ];
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filters)
      .sort(getDoctorSort(req.query.sortBy))
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(filters),
  ]);

  return ApiResponse.success(res, {
    doctors,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  return ApiResponse.success(res, doctor);
});

export const getDoctorSlots = catchAsync(async (req, res, next) => {
  const { date } = req.query;
  if (!date) {
    return next(new AppError('date query parameter is required', 400));
  }

  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
    isAvailableForBooking: true,
  });

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const slots = await ensureSlotsForDate(doctor, date);
  return ApiResponse.success(res, slots.map(toSlotResponse));
});

export const updateDoctorProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'about'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  const doctor = await Doctor.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    return next(new AppError('Doctor profile not found', 404));
  }

  return ApiResponse.success(res, doctor, 'Profile updated successfully');
});

// ── Availability CRUD ──────────────────────────────────────────────────────

export const updateAvailability = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    { availability: req.body.availability || [] },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    return next(new AppError('Doctor profile not found', 404));
  }

  return ApiResponse.success(res, doctor.availability, 'Availability updated successfully');
});

export const getMyAvailability = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user._id).select('availability');
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.success(res, doctor.availability);
});

// ── Qualifications CRUD ────────────────────────────────────────────────────

export const getQualifications = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user._id).select('qualifications');
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.success(res, doctor.qualifications);
});

export const addQualification = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    { $push: { qualifications: req.body } },
    { new: true, runValidators: true }
  );
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.created(res, doctor.qualifications, 'Qualification added');
});

export const updateQualification = catchAsync(async (req, res, next) => {
  const { qualId } = req.params;
  const doctor = await Doctor.findOneAndUpdate(
    { _id: req.user._id, 'qualifications._id': qualId },
    {
      $set: {
        'qualifications.$.degree': req.body.degree,
        'qualifications.$.institution': req.body.institution,
        'qualifications.$.year': req.body.year,
      },
    },
    { new: true, runValidators: true }
  );
  if (!doctor) return next(new AppError('Qualification not found', 404));
  return ApiResponse.success(res, doctor.qualifications, 'Qualification updated');
});

export const deleteQualification = catchAsync(async (req, res, next) => {
  const { qualId } = req.params;
  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    { $pull: { qualifications: { _id: qualId } } },
    { new: true }
  );
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.success(res, doctor.qualifications, 'Qualification deleted');
});

// ── Verification Documents CRUD ────────────────────────────────────────────

export const getVerificationDocuments = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user._id).select('verificationDocuments isVerified');
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.success(res, {
    documents: doctor.verificationDocuments,
    isVerified: doctor.isVerified,
  });
});

export const addVerificationDocument = catchAsync(async (req, res, next) => {
  const { documentType, documentUrl } = req.body;
  if (!documentType || !documentUrl) {
    return next(new AppError('documentType and documentUrl are required', 400));
  }

  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        verificationDocuments: {
          documentType,
          documentUrl,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.created(res, doctor.verificationDocuments, 'Document added');
});

export const deleteVerificationDocument = catchAsync(async (req, res, next) => {
  const { docId } = req.params;
  const doctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    { $pull: { verificationDocuments: { _id: docId } } },
    { new: true }
  );
  if (!doctor) return next(new AppError('Doctor profile not found', 404));
  return ApiResponse.success(res, doctor.verificationDocuments, 'Document deleted');
});

export const getDashboardStats = catchAsync(async (req, res) => {
  const doctorId = req.user._id;
  const today = new Date();
  const todayStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const todayEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)
  );

  const [pendingAppointments, confirmedAppointments, completedAppointments, todayAppointments, earnings] =
    await Promise.all([
      Appointment.countDocuments({ doctor: doctorId, status: 'pending', isActive: true }),
      Appointment.countDocuments({ doctor: doctorId, status: 'confirmed', isActive: true }),
      Appointment.countDocuments({ doctor: doctorId, status: 'completed', isActive: true }),
      Appointment.countDocuments({
        doctor: doctorId,
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        isActive: true,
      }),
      Payment.getDoctorEarnings(doctorId),
    ]);

  return ApiResponse.success(res, {
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    todayAppointments,
    totalAppointments:
      pendingAppointments + confirmedAppointments + completedAppointments,
    totalEarnings: earnings.totalEarnings || 0,
    totalTransactions: earnings.totalTransactions || 0,
  });
});

export const getEarnings = catchAsync(async (req, res) => {
  const now = new Date();
  let startDate;

  switch (req.query.period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = undefined;
  }

  const earnings = await Payment.getDoctorEarnings(req.user._id, startDate, now);
  return ApiResponse.success(res, {
    period: req.query.period || 'all',
    totalEarnings: earnings.totalEarnings || 0,
    totalTransactions: earnings.totalTransactions || 0,
  });
});
