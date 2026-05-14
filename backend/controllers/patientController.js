const PDFDocument = require("pdfkit");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");

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

const createBooking = async (req, res) => {
  try {
    const { testId, bookingDate, timeSlot, notes } = req.body;

    if (!testId || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: "Selected test, preferred date and time slot are required" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Selected test not found" });
    }

    const bookingCode = `BK${Date.now().toString().slice(-6)}`;
    const booking = await Booking.create({
      userId: req.user._id,
      patientId: req.user._id,
      testId: test._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      age: Number(req.body.age || 0),
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      homeSample: false,
      testName: test.testName,
      amount: test.price,
      status: "Pending Approval",
      bookingStatus: "Pending Approval",
      paymentStatus: "Unpaid",
      bookingCode
    });

    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: test.price,
      method: "cash",
      status: "pending"
    });

    res.status(201).json({ message: "Booking request submitted for receptionist approval", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking history" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id, status: "Approved" }).sort({ approvedAt: -1 });
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
    }).populate("bookingId");

    if (!report) {
      return res.status(404).json({ message: "Report not found or not ready" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `report-${report.bookingId.bookingCode || report._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    doc.fontSize(20).text("INDIPATH Super Speciality Lab", { align: "center" });
    doc.fontSize(10).text("Lab logo placeholder", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(16).text("Diagnostic Report", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(11);
    doc.text(`Patient Name: ${report.bookingId.name}`);
    doc.text(`Phone: ${report.bookingId.phone}`);
    doc.text(`Booking ID: ${report.bookingId.bookingCode}`);
    doc.text(`Test: ${report.testName}`);
    doc.text(`Report Approved: ${report.approvedAt ? report.approvedAt.toLocaleString("en-IN") : "N/A"}`);
    doc.moveDown(1);
    doc.fontSize(13).text("Test Results", { underline: true });
    doc.moveDown(0.5);

    report.results.forEach((result, index) => {
      doc.fontSize(11).text(`${index + 1}. ${result.parameter}`);
      doc.text(`   Value: ${result.value}${result.unit ? ` ${result.unit}` : ""}`);
      doc.text(`   Reference Range: ${result.referenceRange || "N/A"}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
    doc.text(`Technician Remarks: ${report.technicianRemarks || "N/A"}`);
    doc.moveDown(1);
    doc.text(`Pathologist Signature: ${report.pathologistSignature}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Report download failed" });
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

    const doc = new PDFDocument({ margin: 50 });
    const filename = `receipt-${booking.bookingCode || booking._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    doc.fontSize(20).text("INDIPATH Super Speciality Lab", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text("Payment Receipt", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(11);
    doc.text(`Receipt Number: ${booking.receiptNumber}`);
    doc.text(`Booking ID: ${booking.bookingCode}`);
    doc.text(`Patient Name: ${booking.name}`);
    doc.text(`Test Name: ${booking.testName}`);
    doc.text(`Booking Date: ${booking.bookingDate}`);
    doc.text(`Time Slot: ${booking.timeSlot}`);
    doc.text(`Total Amount: INR ${booking.amount}`);
    doc.text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`);
    doc.text(`Payment Date: ${booking.paidAt ? booking.paidAt.toLocaleString("en-IN") : "N/A"}`);
    doc.moveDown(1);
    doc.text("Payment received successfully. Thank you for choosing INDIPATH.");
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Receipt download failed" });
  }
};

module.exports = { getTests, createBooking, getBookings, getReports, downloadReport, downloadReceipt };
