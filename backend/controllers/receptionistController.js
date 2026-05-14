const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
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
    const bookings = await Booking.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Confirmed", "Rejected", "Sample Collected", "Processing", "Completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findById(req.params.id).populate("userId", "name email phone");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.bookingStatus = status;
    booking.status = status;
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

    res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
  } catch (error) {
    res.status(500).json({ message: "Booking status update failed", error: error.message });
  }
};

const markPaymentPaid = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const allowedMethods = ["cash", "upi", "card"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Payment method must be cash, upi, or card" });
    }

    const booking = await Booking.findById(req.params.id).populate("userId", "name email phone");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const receiptNumber = booking.receiptNumber || `RCPT-${Date.now()}`;
    booking.paymentStatus = "Paid";
    booking.paymentMethod = paymentMethod;
    booking.receiptNumber = receiptNumber;
    booking.paidAt = new Date();
    await booking.save();

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId._id,
        amount: booking.amount,
        method: paymentMethod,
        status: "paid",
        receiptNumber,
        paidAt: booking.paidAt
      },
      { upsert: true, new: true }
    );

    await sendEmail({
      to: booking.email || booking.userId.email,
      subject: "Payment received successfully",
      text: [
        "Payment received successfully.",
        "",
        `Booking ID: ${booking.bookingCode}`,
        `Test: ${booking.testName}`,
        `Amount: INR ${booking.amount}`,
        "Receipt is available in your dashboard."
      ].join("\n")
    });

    res.json({ message: "Payment marked as paid and receipt generated", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment update failed", error: error.message });
  }
};

module.exports = { getPendingBookings, getAllBookings, updateBookingStatus, markPaymentPaid };
