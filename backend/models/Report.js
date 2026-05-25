const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  normalRange: { type: String }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testName: { type: String, required: true },
  results: [resultSchema],
  technicianRemarks: { type: String },
  pathologistId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pathologistRemarks: { type: String },
  pathologistSignature: { type: String },
  pathologistSignatureImage: { type: String },
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
