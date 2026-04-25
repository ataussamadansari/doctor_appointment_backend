import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import Slot from '../models/Slot.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { AppError } from '../utils/errors.js';
import { ApiResponse } from '../utils/response.js';

const DEFAULT_LIMIT = 10;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getStatusValues = (status) =>
  status
    ? status
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

const isDoctorRequest = (req) => req.user.role === 'doctor';

const buildSort = (statuses) => {
  const upcomingStatuses = new Set(['pending', 'confirmed']);
  const isUpcomingOnly =
    statuses.length > 0 && statuses.every((status) => upcomingStatuses.has(status));

  return isUpcomingOnly ? { appointmentDate: 1, appointmentTime: 1 } : { appointmentDate: -1, appointmentTime: -1 };
};

const populateAppointmentQuery = (query) =>
  query
    .populate('patient', 'firstName lastName email phone profileImage')
    .populate('doctor', 'firstName lastName specialization profileImage consultationFee isVerified')
    .populate('slot');

const assertAppointmentAccess = (appointment, req) => {
  const userId = req.user._id.toString();
  const isOwner =
    appointment.patient?._id?.toString() === userId ||
    appointment.doctor?._id?.toString() === userId;

  if (!isOwner) {
    throw new AppError('You do not have access to this appointment', 403);
  }
};

const createNotification = async (payload) => {
  try {
    await Notification.createNotification(payload);
  } catch (_) {
    // Notifications are non-blocking for core flows.
  }
};

export const bookAppointment = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'patient') {
    return next(new AppError('Only patients can book appointments', 403));
  }

  const doctorId = req.body.doctorId || req.body.doctor;
  const slotId = req.body.slotId || req.body.slot;
  const { appointmentDate, appointmentTime, symptoms, notes } = req.body;

  if (!doctorId || !slotId) {
    return next(new AppError('doctorId and slotId are required', 400));
  }

  const [doctor, slot] = await Promise.all([
    Doctor.findOne({ _id: doctorId, isActive: true, isAvailableForBooking: true }),
    Slot.findOne({ _id: slotId, doctor: doctorId, isActive: true }),
  ]);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }
  if (!doctor.isVerified) {
    return next(new AppError('This doctor is not verified yet. Please choose a verified doctor.', 403));
  }
  if (!slot) {
    return next(new AppError('Selected slot not found', 404));
  }
  if (slot.status !== 'available') {
    return next(new AppError('Selected slot is no longer available', 409));
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctor._id,
    slot: slot._id,
    appointmentDate: appointmentDate || slot.date,
    appointmentTime: appointmentTime || slot.startTime,
    consultationFee: doctor.consultationFee,
    symptoms,
    notes,
    status: 'confirmed',
    paymentStatus: req.body.paymentMethod ? 'paid' : 'pending',
  });

  await Promise.all([
    slot.book(appointment._id),
    Doctor.findByIdAndUpdate(doctor._id, { $inc: { totalAppointments: 1 } }),
    createNotification({
      recipient: req.user._id,
      recipientModel: 'User',
      type: 'appointment_confirmed',
      title: 'Appointment booked',
      message: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is confirmed.`,
      data: { appointmentId: appointment._id.toString() },
    }),
    createNotification({
      recipient: doctor._id,
      recipientModel: 'Doctor',
      type: 'appointment_booked',
      title: 'New appointment',
      message: `${req.user.firstName} ${req.user.lastName} booked an appointment.`,
      data: { appointmentId: appointment._id.toString() },
    }),
  ]);

  const populatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );

  return ApiResponse.created(res, populatedAppointment, 'Appointment booked successfully');
});

export const getPatientAppointments = catchAsync(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
  const statuses = getStatusValues(req.query.status);
  const filters = {
    patient: req.user._id,
    isActive: true,
  };

  if (statuses.length > 0) {
    filters.status = { $in: statuses };
  }

  const [appointments, total] = await Promise.all([
    populateAppointmentQuery(
      Appointment.find(filters)
        .sort(buildSort(statuses))
        .skip((page - 1) * limit)
        .limit(limit)
    ),
    Appointment.countDocuments(filters),
  ]);

  return ApiResponse.success(res, {
    appointments,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getDoctorAppointments = catchAsync(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
  const statuses = getStatusValues(req.query.status);
  const filters = {
    doctor: req.user._id,
    isActive: true,
  };

  if (statuses.length > 0) {
    filters.status = { $in: statuses };
  }
  if (req.query.date) {
    filters.appointmentDate = {
      $gte: new Date(`${req.query.date}T00:00:00.000Z`),
      $lte: new Date(`${req.query.date}T23:59:59.999Z`),
    };
  }

  const [appointments, total] = await Promise.all([
    populateAppointmentQuery(
      Appointment.find(filters)
        .sort(buildSort(statuses))
        .skip((page - 1) * limit)
        .limit(limit)
    ),
    Appointment.countDocuments(filters),
  ]);

  return ApiResponse.success(res, {
    appointments,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const getAppointmentById = catchAsync(async (req, res, next) => {
  const appointment = await populateAppointmentQuery(
    Appointment.findById(req.params.id)
  );

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }

  assertAppointmentAccess(appointment, req);
  return ApiResponse.success(res, appointment);
});

export const cancelAppointment = catchAsync(async (req, res, next) => {
  const appointment = await populateAppointmentQuery(
    Appointment.findById(req.params.id)
  );

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }

  assertAppointmentAccess(appointment, req);

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return next(new AppError('Only pending or confirmed appointments can be cancelled', 400));
  }

  await appointment.cancel(req.body.reason || 'Not specified', req.user.role);
  if (appointment.slot?._id) {
    await Slot.findByIdAndUpdate(appointment.slot._id, {
      status: 'available',
      appointment: null,
    });
  }

  const updatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );

  return ApiResponse.success(res, updatedAppointment, 'Appointment cancelled successfully');
});

export const acceptAppointment = catchAsync(async (req, res, next) => {
  if (!isDoctorRequest(req)) {
    return next(new AppError('Only doctors can accept appointments', 403));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this appointment', 403));
  }

  await appointment.confirm();
  const populatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );
  return ApiResponse.success(res, populatedAppointment, 'Appointment accepted successfully');
});

export const rejectAppointment = catchAsync(async (req, res, next) => {
  if (!isDoctorRequest(req)) {
    return next(new AppError('Only doctors can reject appointments', 403));
  }

  const appointment = await Appointment.findById(req.params.id).populate('slot');
  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this appointment', 403));
  }

  await appointment.cancel(req.body.reason || 'Rejected by doctor', 'doctor');
  if (appointment.slot?._id) {
    await Slot.findByIdAndUpdate(appointment.slot._id, {
      status: 'available',
      appointment: null,
    });
  }

  const populatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );
  return ApiResponse.success(res, populatedAppointment, 'Appointment rejected successfully');
});

export const completeAppointment = catchAsync(async (req, res, next) => {
  if (!isDoctorRequest(req)) {
    return next(new AppError('Only doctors can complete appointments', 403));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this appointment', 403));
  }

  await appointment.complete();
  const populatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );
  return ApiResponse.success(res, populatedAppointment, 'Appointment completed successfully');
});

export const rateAppointment = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'patient') {
    return next(new AppError('Only patients can rate appointments', 403));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  if (appointment.patient.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this appointment', 403));
  }
  if (appointment.rating?.score) {
    return next(new AppError('Appointment has already been rated', 400));
  }

  await appointment.addRating(req.body.score, req.body.review);

  const doctor = await Doctor.findById(appointment.doctor);
  if (doctor) {
    const currentCount = doctor.rating?.count || 0;
    const currentAverage = doctor.rating?.average || 0;
    const nextCount = currentCount + 1;
    const nextAverage = ((currentAverage * currentCount) + Number(req.body.score)) / nextCount;

    doctor.rating.average = Number(nextAverage.toFixed(1));
    doctor.rating.count = nextCount;
    await doctor.save({ validateBeforeSave: false });
  }

  const populatedAppointment = await populateAppointmentQuery(
    Appointment.findById(appointment._id)
  );
  return ApiResponse.success(res, populatedAppointment, 'Rating submitted successfully');
});
