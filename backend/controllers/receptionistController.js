const { renderReceiptPdf, buildPatientPdfFilename } = require("../services/patientPdfService");
const Booking = require("../models/Booking");
const TechnicianAssignment = require("../models/TechnicianAssignment");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");
const User = require("../models/User");
const mongoose = require("mongoose");
const { normalizeBookingStatus } = require('../utils/bookingStatus');
const { notifyGeneratedReceipt } = require('../services/receiptNotificationService');
const { sendWhatsAppMessage } = require("../services/whatsappService");
const { notifyBookingConfirmed, notifyPaymentReceived } = require("../services/patientNotifications");

const generatePatientCode = () => `PID${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
const generateReceiptId = () => `RCT${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
const patientCodeStatuses = ["Confirmed", "Arrived", "Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready"];

const ensurePatientCode = async (booking) => {
  if (!booking || booking.patientCode || !patientCodeStatuses.includes(booking.bookingStatus || booking.status)) {
    return booking;
  }

  booking.patientCode = generatePatientCode();
  await booking.save();
  return booking;
};

const notifyPatient = async (booking, event, lines, parameters = []) => {
  const phone = booking.phone || booking.userId?.phone;
  if (!phone) return;
  await sendWhatsAppMessage({ to: phone, body: lines.filter(Boolean).join('\n'), event, parameters });
};

const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookingStatus: "Pending Approval" })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending bookings" });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { bookingCode: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const bookings = await Booking.find(query)
      .populate("userId", "name email phone")
      .populate("assignedTechnician", "name")
      .sort({ createdAt: -1 });
    const bookingsWithPatientIds = await Promise.all(bookings.map((booking) => ensurePatientCode(booking)));
    res.json(bookingsWithPatientIds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

const getReceptionistTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ testName: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: "technician" }).select("name email phone role").sort({ name: 1 });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: "Error fetching technicians" });
  }
};

const getUnavailableTechniciansForSlot = async (booking) => {
  const slotBookings = await Booking.find({
    _id: { $ne: booking._id },
    bookingDate: booking.bookingDate,
    timeSlot: booking.timeSlot,
    bookingStatus: { $nin: ["Pending Approval", "Rejected", "Cancelled", "Completed", "Report Ready"] }
  }).select("_id assignedTechnician");
  const slotBookingIds = slotBookings.map((item) => item._id);
  const pendingAssignments = slotBookingIds.length
    ? await TechnicianAssignment.find({ booking: { $in: slotBookingIds }, status: "PENDING" }).select("technician")
    : [];
  return [...new Set([
    ...slotBookings.map((item) => item.assignedTechnician).filter(Boolean).map(String),
    ...pendingAssignments.map((item) => String(item.technician))
  ])];
};

const selectFairTechnician = async (excludedTechnicianIds = [], booking = null) => {
  const unavailableForSlot = booking ? await getUnavailableTechniciansForSlot(booking) : [];
  const excludedIds = [...new Set([...excludedTechnicianIds.map(String), ...unavailableForSlot])].filter((id) => mongoose.isValidObjectId(id));
  const technicians = await User.find({
    role: "technician",
    ...(excludedIds.length ? { _id: { $nin: excludedIds } } : {})
  }).select("name email phone role").sort({ name: 1 });

  if (!technicians.length) {
    return null;
  }

  const activeAssignmentStatuses = ["Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval"];
  const [bookingWorkloads, pendingWorkloads, recentRequests] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          assignedTechnician: { $ne: null },
          bookingStatus: { $in: activeAssignmentStatuses }
        }
      },
      { $group: { _id: "$assignedTechnician", count: { $sum: 1 } } }
    ]),
    TechnicianAssignment.aggregate([
      { $match: { status: "PENDING" } },
      { $group: { _id: "$technician", count: { $sum: 1 } } }
    ]),
    TechnicianAssignment.find().select("technician requestedAt").sort({ requestedAt: -1 })
  ]);

  const workloadByTechnician = new Map();
  [...bookingWorkloads, ...pendingWorkloads].forEach((item) => {
    const id = String(item._id);
    workloadByTechnician.set(id, (workloadByTechnician.get(id) || 0) + item.count);
  });
  const lastAssignedByTechnician = new Map();
  recentRequests.forEach((assignment) => {
    const technicianId = String(assignment.technician);
    if (!lastAssignedByTechnician.has(technicianId)) {
      lastAssignedByTechnician.set(technicianId, assignment.requestedAt?.getTime?.() || 0);
    }
  });

  return technicians
    .map((technician) => ({
      technician,
      workload: workloadByTechnician.get(String(technician._id)) || 0,
      lastAssignedAt: lastAssignedByTechnician.get(String(technician._id)) || 0
    }))
    .sort((a, b) => (
      a.workload - b.workload ||
      a.lastAssignedAt - b.lastAssignedAt ||
      a.technician.name.localeCompare(b.technician.name)
    ))[0];
};

const createWalkInBooking = async (req, res) => {
  try {
    const {
      name,
      phone,
      email = "",
      testId,
      bookingDate,
      timeSlot = "Walk-in",
      notes = "",
      gender = "",
      prescribedBy = "",
      collectionType = "Visit Lab",
      address = "",
      homeSample = false
    } = req.body;

    if (!name || !phone || !email || !testId || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: "Patient name, phone, email, test, date and time slot are required" });
    }

    const normalizedCollectionType = collectionType === "Home Collection" ? "Home Collection" : "Visit Lab";
    if (normalizedCollectionType === "Home Collection" && !String(address || "").trim()) {
      return res.status(400).json({ message: "Home visit address is required" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Selected test not found" });
    }

    const booking = await Booking.create({
      testId: test._id,
      name,
      phone,
      age: Number(req.body.age || 0),
      gender,
      email,
      testName: test.testName,
      amount: Number(test.price),
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      prescribedBy,
      doctorNotes: prescribedBy,
      collectionType: normalizedCollectionType,
      homeSample: Boolean(homeSample) || normalizedCollectionType === "Home Collection",
      address,
      bookingStatus: "Confirmed",
      status: "Confirmed",
      paymentStatus: "Unpaid",
      patientCode: generatePatientCode(),
      bookingCode: `BK${Date.now().toString().slice(-6)}`
    });

    await Payment.create({
      bookingId: booking._id,
      amount: booking.amount,
      method: "cash",
      status: "pending"
    });

    await notifyBookingConfirmed(booking);

    res.status(201).json({ message: "Walk-in booking created successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Walk-in booking failed", error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const allowedStatuses = ["Confirmed", "Rejected", "Arrived"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findById(req.params.id).populate("userId", "name email phone").lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Read stored fields without schema defaults so legacy bookings can be updated.
    const currentStatus = normalizeBookingStatus(booking);
    const statusSnapshot = { _id: booking._id, bookingStatus: booking.bookingStatus ?? null, status: booking.status ?? null };
    if ((["Confirmed", "Rejected"].includes(status) && currentStatus !== "Pending Approval")
      || (status === "Arrived" && !["Confirmed", "Technician Assigned"].includes(currentStatus))) {
      return res.status(409).json({ message: "This booking has already progressed. Refresh the booking list." });
    }
    const appointmentUpdate = {};
    if (status === "Confirmed" && (!booking.timeSlot || !booking.bookingDate)) {
      const bookingDate = String(req.body.bookingDate || '').trim();
      const timeSlot = String(req.body.timeSlot || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !Number.isFinite(Date.parse(`${bookingDate}T12:00:00Z`)) || !timeSlot || timeSlot.length > 100) {
        return res.status(400).json({ message: "This older booking needs an appointment date and time slot before confirmation." });
      }
      Object.assign(appointmentUpdate, { bookingDate, date: bookingDate, timeSlot });
      Object.assign(booking, appointmentUpdate);
    }
    if (status === "Confirmed" && currentStatus === "Pending Approval") {
      const [technicianCount, reservedBookingCount] = await Promise.all([
        User.countDocuments({ role: "technician" }),
        Booking.countDocuments({
          _id: { $ne: booking._id },
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          bookingStatus: { $nin: ["Pending Approval", "Rejected", "Cancelled", "Completed", "Report Ready"] }
        })
      ]);
      if (!technicianCount || reservedBookingCount >= technicianCount) {
        booking.bookingStatus = "Rejected";
        booking.status = "Rejected";
        booking.rejectionReason = !technicianCount
          ? "No laboratory technician is currently available."
          : "The selected appointment slot is full. Please choose another date or time.";
        const rejection = await Booking.updateOne(statusSnapshot, { $set: {
          bookingStatus: "Rejected", status: "Rejected", rejectionReason: booking.rejectionReason
        } });
        if (!rejection.modifiedCount) return res.status(409).json({ message: "Booking changed. Refresh and try again." });
        await notifyPatient(booking, "booking_rejected", [
          "INDIPATH booking request rejected.",
          "",
          `Booking ID: ${booking.bookingCode}`,
          `Test: ${booking.testName}`,
          `Reason: ${booking.rejectionReason}`
        ], [booking.name, booking.bookingCode, booking.testName, booking.rejectionReason]);
        return res.json({ message: `Booking automatically rejected: ${booking.rejectionReason}`, booking, autoRejected: true });
      }
    }

    const previousStatus = currentStatus;
    const nextStatus = status === "Arrived" && currentStatus === "Technician Assigned" ? currentStatus : status;
    booking.bookingStatus = nextStatus;
    booking.status = nextStatus;
    if (["Confirmed", "Arrived"].includes(status) && !booking.patientCode) {
      booking.patientCode = generatePatientCode();
    }
    if (status === "Arrived") {
      booking.patientArrived = true;
    }
    if (status === "Sample Collected") {
      booking.sampleStatus = "Collected";
      booking.sampleCollectedAt ||= new Date();
    }
    if (status === "Rejected") {
      booking.rejectionReason = rejectionReason || "No reason provided";
    }
    const statusUpdate = await Booking.updateOne(statusSnapshot, { $set: {
      bookingStatus: nextStatus, status: nextStatus, ...appointmentUpdate,
      ...(booking.patientCode ? { patientCode: booking.patientCode } : {}),
      ...(status === "Arrived" ? { patientArrived: true } : {}),
      ...(status === "Rejected" ? { rejectionReason: booking.rejectionReason } : {})
    } });
    if (!statusUpdate.modifiedCount) return res.status(409).json({ message: "Booking changed. Refresh and try again." });

    if (status === "Confirmed" && previousStatus !== status) {
      await notifyBookingConfirmed(booking);
    }

    if (status === "Rejected" && previousStatus !== status) {
      await notifyPatient(booking, "booking_rejected", [
        "INDIPATH booking request rejected.",
        "",
        `Booking ID: ${booking.bookingCode}`,
        `Test: ${booking.testName}`,
        `Reason: ${booking.rejectionReason}`
      ], [booking.name, booking.bookingCode, booking.testName, booking.rejectionReason]);
    }

    res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
  } catch (error) {
    res.status(500).json({ message: "Booking status update failed", error: error.message });
  }
};

const getTechnicianAssignments = async (req, res) => {
  try {
    if (req.query.bookingId && !mongoose.isValidObjectId(req.query.bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    const query = req.query.bookingId ? { booking: req.query.bookingId } : {};
    const assignments = await TechnicianAssignment.find(query)
      .populate("booking", "bookingCode patientCode name testName sampleType bookingStatus paymentStatus assignedTechnician")
      .populate("technician", "name email phone")
      .populate("requestedBy", "name role")
      .sort({ requestedAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Unable to load technician assignment history" });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Payment must be paid before assigning a technician" });
    }

    if (booking.assignedTechnician || await TechnicianAssignment.exists({ booking: booking._id, status: "ACCEPTED" })) {
      return res.status(409).json({ message: "The assignment has already been accepted by a technician." });
    }

    if (!["Confirmed", "Arrived"].includes(normalizeBookingStatus(booking))) {
      return res.status(409).json({ message: "Only confirmed or arrived bookings can receive a new technician request." });
    }

    const pending = await TechnicianAssignment.findOne({ booking: booking._id, status: "PENDING" });
    if (pending) {
      return res.status(409).json({ message: "A technician assignment request is already pending for this booking." });
    }

    const previousTechnicianIds = await TechnicianAssignment.distinct("technician", { booking: booking._id, status: "REJECTED" });
    let selection = await selectFairTechnician(previousTechnicianIds, booking);
    // If every technician rejected previously, start a new fair cycle instead
    // of leaving the booking permanently unassignable.
    if (!selection && previousTechnicianIds.length) selection = await selectFairTechnician([], booking);
    if (!selection) return res.status(409).json({ message: "No technician is available for this booking's date and time slot." });
    const { technician, workload } = selection;

    const assignment = await TechnicianAssignment.create({
      booking: booking._id,
      technician: technician._id,
      requestedBy: req.user._id,
      status: "PENDING",
      requestedAt: new Date()
    });
    await assignment.populate([
      { path: "booking", select: "bookingCode patientCode name testName sampleType bookingStatus paymentStatus assignedTechnician" },
      { path: "technician", select: "name email phone" },
      { path: "requestedBy", select: "name role" }
    ]);

    res.status(201).json({ message: `Assignment request automatically sent to ${technician.name} (current workload: ${workload}).`, assignment });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A technician assignment request is already pending for this booking." });
    }
    res.status(500).json({ message: "Technician assignment failed", error: error.message });
  }
};

const markPaymentPaid = async (req, res) => {
  try {
    const { paymentMethod, amount } = req.body;
    const allowedMethods = ["cash", "upi", "card"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Payment method must be cash, upi, or card" });
    }

    const booking = await Booking.findById(req.params.id).populate("userId", "name email phone");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentPreference === "online") {
      return res.status(409).json({ message: "Online bookings must be paid through the patient's Pay Now option. Gateway verification updates payment automatically." });
    }
    if (!["Confirmed", "Arrived"].includes(booking.bookingStatus) || booking.paymentStatus === "Paid") {
      return res.status(409).json({ message: "Only confirmed, unpaid bookings can be marked paid" });
    }

    const alreadyPaid = booking.paymentStatus === "Paid";
    const receiptNumber = booking.receiptNumber || `RCPT-${Date.now()}`;
    const receiptId = booking.receiptId || generateReceiptId();
    const paidAmount = Number(amount || booking.amount);

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    booking.amount = paidAmount;
    if (!booking.patientCode && patientCodeStatuses.includes(booking.bookingStatus || booking.status)) {
      booking.patientCode = generatePatientCode();
    }
    booking.paymentStatus = "Paid";
    booking.paymentMethod = paymentMethod;
    booking.receiptNumber = receiptNumber;
    booking.receiptId = receiptId;
    booking.paymentDate = new Date();
    booking.paidAt = booking.paymentDate;
    await booking.save();

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId?._id,
        amount: paidAmount,
        method: paymentMethod,
        status: "paid",
        receiptNumber,
        receiptId,
        paymentDate: booking.paymentDate,
        paidAt: booking.paidAt
      },
      { upsert: true, new: true }
    );

    if (!alreadyPaid) await notifyPaymentReceived(booking);

    res.json({ message: "Payment marked as paid and receipt generated", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment update failed", error: error.message });
  }
};

const downloadReceptionistReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Receipt can be generated only after payment is paid" });
    }

    if (!booking.receiptId) {
      booking.receiptId = generateReceiptId();
      await booking.save();
      await Payment.findOneAndUpdate(
        { bookingId: booking._id },
        { receiptId: booking.receiptId },
        { new: true }
      );
    }

    const filename = buildPatientPdfFilename(booking.name, booking.patientCode, "RCT");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.once('finish', () => { if (res.statusCode === 200) void notifyGeneratedReceipt(booking); });
    renderReceiptPdf(booking, res);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: "Receipt generation failed" });
    else res.destroy(error);
  }
};

module.exports = {
  getPendingBookings,
  getAllBookings,
  getReceptionistTests,
  getTechnicians,
  createWalkInBooking,
  updateBookingStatus,
  assignTechnician,
  getTechnicianAssignments,
  markPaymentPaid,
  downloadReceptionistReceipt
};
