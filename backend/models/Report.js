const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  normalRange: { type: String },
  status: {
    type: String,
    enum: ["Normal", "Low", "High", "Abnormal", "Critical", "Not Set"],
    default: "Not Set"
  }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  reportId: { type: String },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testName: { type: String, required: true },
  reportLetterhead: { type: String, default: "" },
  reportDescription: { type: String, default: "" },
  results: [resultSchema],
  technicianRemarks: { type: String },
  pathologistId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pathologistRemarks: { type: String },
  pathologistSignature: { type: String },
  pathologistSignatureImage: { type: String },
  approvedPathologistName: { type: String },
  approvedPathologistQualification: { type: String },
  approvedPathologistRegistrationNumber: { type: String },
  authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorizedPersonName: { type: String, trim: true },
  authorizedSignatureImage: { type: String, trim: true },
  authorizedAt: { type: Date },
  authorizationStatus: {
    type: String,
    enum: ["Pending", "Authorized"],
    default: "Pending"
  },
  rejectionReason: { type: String },
  reportStatus: {
    type: String,
    enum: ["Draft", "Pending Approval", "Approved", "Rejected"],
    default: "Draft"
  },
  finalStatus: {
    type: String,
    enum: ["Draft", "Pending Approval", "Report Ready", "Correction Needed"],
    default: "Draft"
  },
  status: {
    type: String,
    enum: ["Draft", "Pending Review", "Pending Approval", "Approved", "Rejected"],
    default: "Draft"
  },
  submittedAt: { type: Date },
  approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
