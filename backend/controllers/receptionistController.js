const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Test = require("../models/Test");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const { sendEmail } = require("../config/email");

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
    res.json(bookings);
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

const createWalkInBooking = async (req, res) => {
  try {
    const { name, phone, testId, bookingDate, timeSlot = "Walk-in", notes = "" } = req.body;

    if (!name || !phone || !testId || !bookingDate) {
      return res.status(400).json({ message: "Patient name, phone, test and date are required" });
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
      email: req.body.email || "",
      testName: test.testName,
      amount: Number(test.price),
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      bookingStatus: "Confirmed",
      status: "Confirmed",
      paymentStatus: "Unpaid",
      bookingCode: `BK${Date.now().toString().slice(-6)}`
    });

    await Payment.create({
      bookingId: booking._id,
      amount: booking.amount,
      method: "cash",
      status: "pending"
    });

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
      await sendEmail({
        to: booking.email || booking.userId.email,
        subject: "Your pathology test booking is confirmed",
        text: [
          "Your pathology test booking has been confirmed.",
          "",
          `Booking ID: ${booking.bookingCode}`,
          `Test: ${booking.testName}`,
          `Date: ${booking.bookingDate}`,
          `Time Slot: ${booking.timeSlot}`
        ].join("\n")
      });
    }

    if (status === "Rejected") {
      await sendEmail({
        to: booking.email || booking.userId.email,
        subject: "Your pathology test booking was rejected",
        text: [
          "Your pathology test booking was rejected.",
          "",
          `Booking ID: ${booking.bookingCode}`,
          `Test: ${booking.testName}`,
          `Reason: ${booking.rejectionReason}`
        ].join("\n")
      });
    }

    res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
  } catch (error) {
    res.status(500).json({ message: "Booking status update failed", error: error.message });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: "Technician is required" });
    }

    const technician = await User.findOne({ _id: technicianId, role: "technician" });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if ((!booking.patientArrived && booking.bookingStatus !== "Arrived") || booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Patient must be arrived and payment must be paid before assigning technician" });
    }

    booking.assignedTechnician = technician._id;
    booking.bookingStatus = "Technician Assigned";
    booking.status = "Technician Assigned";
    await booking.save();

    res.json({ message: "Technician assigned successfully", booking });
  } catch (error) {
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
    const paidAmount = Number(amount || booking.amount);

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    booking.amount = paidAmount;
    booking.paymentStatus = "Paid";
    booking.paymentMethod = paymentMethod;
    booking.receiptNumber = receiptNumber;
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
        paymentDate: booking.paymentDate,
        paidAt: booking.paidAt
      },
      { upsert: true, new: true }
    );

    const paymentEmail = booking.email || booking.userId?.email;
    if (paymentEmail) {
      await sendEmail({
        to: paymentEmail,
        subject: "Payment received successfully",
        text: [
          "Payment received successfully.",
          "",
          `Booking ID: ${booking.bookingCode}`,
          `Test: ${booking.testName}`,
          `Amount: INR ${paidAmount}`,
          "Receipt is available in your dashboard."
        ].join("\n")
      });
    }

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
    doc.text(`Test: ${booking.testName}`);
    doc.text(`Amount: INR ${booking.amount}`);
    doc.text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`);
    doc.text(`Payment Date: ${booking.paidAt ? booking.paidAt.toLocaleString("en-IN") : "N/A"}`);
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
  markPaymentPaid,
  downloadReceptionistReceipt
};
