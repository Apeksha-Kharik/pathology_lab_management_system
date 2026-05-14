const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  testName: { type: String, required: true },
  results: [resultSchema],
  technicianRemarks: { type: String },
  pathologistSignature: { type: String },
  status: {
    type: String,
    enum: ["Draft", "Pending Review", "Approved"],
    default: "Draft"
  },
  approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
