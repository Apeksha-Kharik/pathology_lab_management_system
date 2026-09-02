const mongoose = require("mongoose");

const technicianAssignmentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING", required: true },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: "" },
  requestedAt: { type: Date, default: Date.now, required: true },
  respondedAt: { type: Date, default: null }
}, { timestamps: true });

// Only one unanswered request and one accepted technician can exist per job.
technicianAssignmentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" }, name: "one_pending_assignment_per_booking" }
);
technicianAssignmentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: "ACCEPTED" }, name: "one_accepted_assignment_per_booking" }
);
technicianAssignmentSchema.index({ booking: 1, requestedAt: -1 });
technicianAssignmentSchema.index({ technician: 1, status: 1, requestedAt: -1 });

module.exports = mongoose.model("TechnicianAssignment", technicianAssignmentSchema);
