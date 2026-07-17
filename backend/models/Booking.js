const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  bookingType: { type: String, enum: ["Test", "Package"], default: "Test" },
  name: { type: String, required: true },
  testName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  date: { type: String, required: true },
  homeSample: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  bookingDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  notes: { type: String },
  doctorNotes: { type: String },
  sampleType: { type: String },
  rejectionReason: { type: String },
  sampleStatus: {
    type: String,
    enum: ["Not Collected", "Collected"],
    default: "Not Collected"
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testStarted: { type: Boolean, default: false },
  testStartedAt: { type: Date },
  status: {
    type: String,
    enum: ["Pending Approval", "Confirmed", "Rejected", "Arrived", "Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready", "Cancelled"],
    default: "Pending Approval"
  },
  bookingStatus: {
    type: String,
    enum: ["Pending Approval", "Confirmed", "Rejected", "Arrived", "Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready", "Cancelled"],
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
  patientArrived: { type: Boolean, default: false },
  paymentDate: { type: Date },
  paidAt: { type: Date },
  receiptNumber: { type: String },
  bookingCode: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
