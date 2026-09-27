const { renderReportPdf, renderReceiptPdf, buildPatientPdfFilename } = require("../services/patientPdfService");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");
const Package = require("../models/Package");
const { notifyBookingRequested } = require("../services/patientNotifications");


const patientCodeStatuses = ["Confirmed", "Arrived", "Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready"];
const generatePatientCode = () => `PID${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
const generateReceiptId = () => `RCT${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

const ensurePatientCode = async (booking) => {
  if (!booking || booking.patientCode || !patientCodeStatuses.includes(booking.bookingStatus || booking.status)) {
    return booking;
  }

  booking.patientCode = generatePatientCode();
  await booking.save();
  return booking;
};

const getTests = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { testName: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const tests = await Test.find(query).sort({ testName: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: { $ne: false }, status: { $ne: "inactive" }, includedTests: { $exists: true, $ne: [] } })
      .populate("includedTests", "testName category price description isActive")
      .sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages" });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      testId, packageId, bookingDate, timeSlot, notes, age, gender, sampleType,
      name, patientName: requestedPatientName, phone, email, prescribedBy, doctorNotes,
      collectionType, address, homeSample, paymentPreference = "cash"
    } = req.body;

    if (!["cash", "online"].includes(paymentPreference)) {
      return res.status(400).json({ message: "Select cash on delivery or online payment" });
    }

    if ((!testId && !packageId) || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: "Select a test or package, preferred date and time slot" });
    }

    const bookingType = packageId ? "Package" : "Test";
    const selectedItem = packageId
      ? await Package.findOne({ _id: packageId, isActive: { $ne: false }, status: { $ne: "inactive" }, includedTests: { $exists: true, $ne: [] } })
      : await Test.findById(testId);
    if (selectedItem && bookingType === "Package") {
      const activeTestCount = await Test.countDocuments({ _id: { $in: selectedItem.includedTests }, isActive: { $ne: false } });
      if (activeTestCount !== selectedItem.includedTests.length) return res.status(400).json({ message: "This package contains an unavailable test and cannot be booked" });
    }

    if (!selectedItem) {
      return res.status(404).json({ message: `Selected ${bookingType.toLowerCase()} not found` });
    }

    const bookingAmount = bookingType === "Package" && selectedItem.discountPrice !== null && selectedItem.discountPrice !== undefined ? selectedItem.discountPrice : selectedItem.price;
    const patientName = String(name || requestedPatientName || req.user.name || "").trim();
    const patientPhone = String(phone || req.user.phone || "").trim();
    const patientEmail = String(email || req.user.email || "").trim();
    const patientAge = Number(age || req.user.age || 0);
    if (!patientName || !patientPhone || !Number.isFinite(patientAge) || patientAge <= 0) {
      return res.status(400).json({ message: "Valid patient name, phone and age are required" });
    }

    const bookingCode = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
    const booking = await Booking.create({
      userId: req.user._id,
      patientId: req.user._id,
      testId: bookingType === "Test" ? selectedItem._id : undefined,
      packageId: bookingType === "Package" ? selectedItem._id : undefined,
      packageTests: bookingType === "Package" ? selectedItem.includedTests.map((test) => test._id || test) : [],
      bookingType,
      name: patientName,
      phone: patientPhone,
      email: patientEmail,
      age: patientAge,
      gender: gender || req.user.gender || "",
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      prescribedBy: prescribedBy || "",
      doctorNotes: doctorNotes || prescribedBy || "",
      collectionType: collectionType === "Home Collection" ? "Home Collection" : "Visit Lab",
      address: address || "",
      sampleType: sampleType || "",
      homeSample: Boolean(homeSample),
      testName: bookingType === "Package" ? selectedItem.packageName : selectedItem.testName,
      amount: bookingAmount,
      status: "Pending Approval",
      bookingStatus: "Pending Approval",
      paymentStatus: "Unpaid",
      paymentPreference,
      bookingCode
    });

    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: bookingAmount,
      method: paymentPreference === "online" ? "razorpay" : "cash",
      status: "pending"
    });

    await notifyBookingRequested(booking);

    res.status(201).json({ message: "Booking request submitted for receptionist approval", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const bookingsWithPatientIds = await Promise.all(bookings.map((booking) => ensurePatientCode(booking)));
    res.json(bookingsWithPatientIds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking history" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id, status: "Approved" })
      .populate("bookingId")
      .populate("approvedBy", "name qualification registrationNumber signatureUrl")
      .populate("authorizedBy", "name qualification registrationNumber signatureUrl")
      .sort({ approvedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.reportId,
      userId: req.user._id,
      status: "Approved"
    }).populate("bookingId").populate("approvedBy", "name qualification registrationNumber signatureUrl").populate("authorizedBy", "name qualification registrationNumber signatureUrl");

    if (!report) {
      return res.status(404).json({ message: "Report not found or not ready" });
    }

    const booking = report.bookingId || {};
    const results = Array.isArray(report.results) ? report.results : [];
    const filename = buildPatientPdfFilename(booking.name, booking.patientCode || booking.bookingCode, "RPT");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    renderReportPdf(report, req.user, res);
  } catch (error) {
    console.error("Report PDF generation failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Report download failed" });
    } else {
      res.end();
    }
  }
};

const downloadReceipt = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Receipt is available only after payment is marked as paid" });
    }

    const filename = buildPatientPdfFilename(booking.name, booking.patientCode || booking.bookingCode, "RCT");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    renderReceiptPdf(booking, res);
  } catch (error) {
    res.status(500).json({ message: "Receipt download failed" });
  }
};

module.exports = { getTests, getPackages, createBooking, getBookings, getReports, downloadReport, downloadReceipt };
