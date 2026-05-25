const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["cash", "upi", "card"],
    default: "cash"
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  transactionId: { type: String },
  receiptNumber: { type: String },
  paymentDate: { type: Date },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
