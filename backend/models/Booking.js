const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  name: { type: String, required: true },
  testName: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  date: { type: String, required: true },
  homeSample: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  bookingDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ["Pending Approval", "Confirmed", "Rejected", "Sample Collected", "Processing", "Completed", "Report Ready", "Cancelled"],
    default: "Pending Approval"
  },
  bookingStatus: {
    type: String,
    enum: ["Pending Approval", "Confirmed", "Rejected", "Sample Collected", "Processing", "Completed", "Report Ready", "Cancelled"],
    default: "Pending Approval"
  },
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Paid", "Failed", "Refunded"],
    default: "Unpaid"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card"],
    default: "cash"
  },
  paidAt: { type: Date },
  receiptNumber: { type: String },
  bookingCode: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
