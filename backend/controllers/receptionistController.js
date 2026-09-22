const Booking = require("../models/Booking");
const TechnicianAssignment = require("../models/TechnicianAssignment");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");
const User = require("../models/User");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const letterheadImagePath = path.join(__dirname, "..", "assets", "indipath-letterhead.png");
const pdfLayout = {
  left: 56,
  right: 506,
  contentTop: 124
};

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

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";

const buildPatientPdfFilename = (name, patientCode, documentType = "RCT") => `${safeFilePart(name)}-${safeFilePart(patientCode || "pending-patient-id")}-${safeFilePart(documentType).toUpperCase()}.pdf`;

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "N/A";
const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const drawLetterhead = (doc) => {
  if (!fs.existsSync(letterheadImagePath)) {
    doc.y = 72;
    return false;
  }

  doc.image(letterheadImagePath, 0, 0, {
    cover: [doc.page.width, doc.page.height],
    align: "center",
    valign: "center"
  });
  doc.y = pdfLayout.contentTop;
  return true;
};

const drawTitleBlock = (doc, title, subtitle) => {
  const top = doc.y;
  doc.roundedRect(pdfLayout.left, top, pdfLayout.right - pdfLayout.left, 38, 4).fill("#173b8f");
  doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text(title, pdfLayout.left + 10, top + 10, { width: 430, align: "center" });
  doc.fillColor("#dff7ea").fontSize(7.5).font("Helvetica-Bold").text(subtitle, pdfLayout.left + 10, top + 28, { width: 430, align: "center" });
  doc.y = top + 52;
};

const drawInfoGrid = (doc, title, rows) => {
  const width = pdfLayout.right - pdfLayout.left;
  const left = pdfLayout.left;
  const startY = doc.y;
  const rowHeight = 22;
  const headerHeight = 22;
  const bodyHeight = Math.ceil(rows.length / 2) * rowHeight;

  doc.roundedRect(left, startY, width, headerHeight + bodyHeight + 10, 5).fill("#ffffff").strokeColor("#cfe4d8").stroke();
  doc.rect(left, startY, width, headerHeight).fill("#187b4b");
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold").text(title, left + 12, startY + 7);

  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column ? 284 : left + 12;
    const y = startY + headerHeight + 11 + (row * rowHeight);
    doc.fillColor("#173b8f").fontSize(7.5).font("Helvetica-Bold").text(label.toUpperCase(), x, y, { width: 82 });
    doc.fillColor("#1f2937").fontSize(8.8).font("Helvetica").text(String(value || "N/A"), x + 86, y, { width: 128, height: 18, ellipsis: true });
  });

  doc.y = startY + headerHeight + bodyHeight + 24;
};

const drawReceiptBox = (doc, rows) => {
  const left = 80;
  const top = doc.y;
  const width = 395;
  const rowHeight = 28;

  doc.roundedRect(left, top, width, (rows.length * rowHeight) + 20, 6).fill("#ffffff").strokeColor("#cfe4d8").stroke();
  rows.forEach(([label, value], index) => {
    const y = top + 12 + (index * rowHeight);
    if (index) doc.moveTo(left + 16, y - 7).lineTo(left + width - 16, y - 7).strokeColor("#edf7f1").stroke();
    doc.fillColor("#64748b").fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), left + 20, y, { width: 140 });
    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text(String(value || "N/A"), left + 180, y - 1, { width: 200, align: "right" });
  });

  doc.y = top + (rows.length * rowHeight) + 36;
};

const notifyPatient = async (booking, lines) => {
  const phone = booking.phone || booking.userId?.phone;
  if (!phone) return;
  await sendWhatsAppMessage({
    to: phone,
    body: lines.filter(Boolean).join("\n")
  });
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

const selectFairTechnician = async () => {
  const technicians = await User.find({ role: "technician" }).select("name email phone role").sort({ name: 1 });

  if (!technicians.length) {
    return null;
  }

  const activeAssignmentStatuses = ["Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval"];
  const [workloads, recentAssignments] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          assignedTechnician: { $ne: null },
          bookingStatus: { $in: activeAssignmentStatuses }
        }
      },
      { $group: { _id: "$assignedTechnician", count: { $sum: 1 } } }
    ]),
    Booking.find({ assignedTechnician: { $ne: null } })
      .select("assignedTechnician updatedAt")
      .sort({ updatedAt: -1 })
  ]);

  const workloadByTechnician = new Map(workloads.map((item) => [String(item._id), item.count]));
  const lastAssignedByTechnician = new Map();
  recentAssignments.forEach((booking) => {
    const technicianId = String(booking.assignedTechnician);
    if (!lastAssignedByTechnician.has(technicianId)) {
      lastAssignedByTechnician.set(technicianId, booking.updatedAt?.getTime?.() || 0);
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
    ))[0].technician;
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

    await notifyPatient(booking, [
      "INDIPATH booking confirmed.",
      "",
      `Patient ID: ${booking.patientCode}`,
      `Booking ID: ${booking.bookingCode}`,
      `Test: ${booking.testName}`,
      `Date: ${booking.bookingDate}`,
      `Time Slot: ${booking.timeSlot}`
    ]);

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

    const booking = await Booking.findById(req.params.id).populate("userId", "name email phone");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.bookingStatus = status;
    booking.status = status;
    if (["Confirmed", "Arrived"].includes(status) && !booking.patientCode) {
      booking.patientCode = generatePatientCode();
    }
    if (status === "Arrived") {
      booking.patientArrived = true;
    }
    if (status === "Sample Collected") {
      booking.sampleStatus = "Collected";
    }
    if (status === "Rejected") {
      booking.rejectionReason = rejectionReason || "No reason provided";
    }
    await booking.save();

    if (status === "Confirmed") {
      await notifyPatient(booking, [
        "INDIPATH booking confirmed.",
        "",
        `Patient ID: ${booking.patientCode}`,
        `Booking ID: ${booking.bookingCode}`,
        `Test: ${booking.testName}`,
        `Date: ${booking.bookingDate}`,
        `Time Slot: ${booking.timeSlot}`
      ]);
    }

    if (status === "Rejected") {
      await notifyPatient(booking, [
        "INDIPATH booking request rejected.",
        "",
        `Booking ID: ${booking.bookingCode}`,
        `Test: ${booking.testName}`,
        `Reason: ${booking.rejectionReason}`
      ]);
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
    const technicianId = String(req.body.technicianId || "").trim();
    if (!mongoose.isValidObjectId(technicianId)) {
      return res.status(400).json({ message: "Please select a technician." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if ((!booking.patientArrived && booking.bookingStatus !== "Arrived") || booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Patient must be arrived and payment must be paid before assigning technician" });
    }

    if (booking.assignedTechnician || await TechnicianAssignment.exists({ booking: booking._id, status: "ACCEPTED" })) {
      return res.status(409).json({ message: "The assignment has already been accepted by a technician." });
    }

    const technician = await User.findOne({ _id: technicianId, role: "technician" }).select("name email phone role");
    if (!technician) {
      return res.status(404).json({ message: "Selected technician is not available." });
    }

    const pending = await TechnicianAssignment.findOne({ booking: booking._id, status: "PENDING" });
    if (pending) {
      return res.status(409).json({
        message: String(pending.technician) === technicianId
          ? "This technician has already received a pending request."
          : "Another technician assignment request is still pending."
      });
    }

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

    res.status(201).json({ message: `Assignment request sent to ${technician.name}.`, assignment });
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

    await notifyPatient(booking, [
      "INDIPATH payment received successfully.",
      "",
      `Patient ID: ${booking.patientCode || "Pending"}`,
      `Booking ID: ${booking.bookingCode}`,
      `Receipt ID: ${booking.receiptId}`,
      `Test: ${booking.testName}`,
      `Amount: INR ${paidAmount}`,
      "Receipt is available in your dashboard."
    ]);

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

    const report = await Report.findOne({ bookingId: booking._id })
      .sort({ createdAt: -1 })
      .populate("approvedBy", "name");
    const pathologistName = report?.approvedPathologistName || report?.approvedBy?.name || report?.pathologistSignature || "Pending";

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const filename = buildPatientPdfFilename(booking.name, booking.patientCode, "RCT");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    drawLetterhead(doc);
    drawTitleBlock(doc, "TEST RECEIPT", "Patient test, billing and laboratory status receipt");
    drawInfoGrid(doc, "PATIENT DETAILS", [
      ["Patient Name", booking.name],
      ["Patient ID", booking.patientCode || "Pending"],
      ["Age / Gender", `${booking.age || "N/A"} / ${booking.gender || "N/A"}`],
      ["Phone", booking.phone || "N/A"]
    ]);
    drawInfoGrid(doc, "TEST DETAILS", [
      ["Test / Package", booking.testName],
      ["Booking Type", booking.bookingType || "Test"],
      ["Booking ID", booking.bookingCode],
      ["Appointment", `${booking.bookingDate || booking.date || "N/A"} | ${booking.timeSlot || "N/A"}`],
      ["Sample Type", booking.sampleType || "N/A"],
      ["Collection", booking.collectionType || "Visit Lab"]
    ]);
    drawInfoGrid(doc, "SAMPLE & REPORT STATUS", [
      ["Sample Status", booking.sampleStatus || "Not Collected"],
      ["Report Status", report?.reportStatus || report?.status || "Pending"],
      ["Pathologist Name", pathologistName],
      ["Booking Status", booking.bookingStatus || booking.status || "Pending"]
    ]);
    drawReceiptBox(doc, [
      ["Receipt ID", booking.receiptId || booking.receiptNumber],
      ["Receipt No.", booking.receiptNumber],
      ["Total Amount", formatCurrency(booking.amount)],
      ["Payment Method", String(booking.paymentMethod || "N/A").toUpperCase()],
      ["Payment Status", booking.paymentStatus],
      ["Payment Date", formatDateTime(booking.paidAt)]
    ]);
    const acknowledgementTop = doc.y;
    doc.roundedRect(80, acknowledgementTop, 395, 46, 6).fill("#f0fdf4").strokeColor("#bbf7d0").stroke();
    doc.fillColor("#166534").fontSize(11).font("Helvetica-Bold").text("Payment received successfully.", 100, acknowledgementTop + 11, { width: 355, align: "center" });
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text("Thank you for choosing INDIPATH Super Speciality Pathology Lab.", 100, acknowledgementTop + 28, { width: 355, align: "center" });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Receipt generation failed" });
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
