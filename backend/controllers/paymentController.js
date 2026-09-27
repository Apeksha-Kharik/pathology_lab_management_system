const crypto = require("crypto");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { notifyPaymentReceived } = require("../services/patientNotifications");
const { createOrder, fetchPayment, isConfigured } = require("../services/razorpayService");

const createPaymentOrder = async (req, res) => {
  try {
    if (!isConfigured()) return res.status(503).json({ message: "Online payment is not configured" });
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.paymentStatus === "Paid") return res.status(409).json({ message: "This booking is already paid" });
    if (!["Confirmed", "Arrived"].includes(booking.bookingStatus)) return res.status(400).json({ message: "Payment is available after the booking is confirmed" });

    const amount = Math.round(Number(booking.amount) * 100);
    if (!Number.isSafeInteger(amount) || amount < 100) return res.status(400).json({ message: "Invalid booking amount" });
    const order = await createOrder({ amount, currency: "INR", receipt: `booking_${booking._id}`.slice(0, 40), notes: { bookingId: String(booking._id), patientId: String(req.user._id) } });
    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { userId: req.user._id, amount: booking.amount, method: "online", status: "pending", razorpayOrderId: order.id, gateway: "razorpay" },
      { upsert: true, new: true }
    );
    res.status(201).json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency, booking: { id: booking._id, code: booking.bookingCode, testName: booking.testName, name: booking.name, phone: booking.phone, email: booking.email } });
  } catch (error) {
    res.status(502).json({ message: "Unable to start online payment. Please try again." });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signatureValue } = req.body;
    const signature = String(signatureValue || "");
    if (!orderId || !paymentId || !signature) return res.status(400).json({ message: "Incomplete payment response" });
    const paymentRecord = await Payment.findOne({ bookingId: req.params.bookingId, userId: req.user._id, razorpayOrderId: orderId });
    if (!paymentRecord) return res.status(404).json({ message: "Payment order not found" });
    if (paymentRecord.status === "paid") {
      const booking = await Booking.findById(paymentRecord.bookingId);
      return res.json({ message: "Payment already verified", booking });
    }
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    const valid = /^[a-f0-9]{64}$/i.test(signature) && crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
    if (!valid) return res.status(400).json({ message: "Payment signature verification failed" });

    const gatewayPayment = await fetchPayment(paymentId);
    const expectedAmount = Math.round(Number(paymentRecord.amount) * 100);
    if (gatewayPayment.order_id !== orderId || gatewayPayment.currency !== "INR" || gatewayPayment.amount !== expectedAmount || gatewayPayment.status !== "captured") {
      return res.status(409).json({ message: "Payment has not been captured. Please contact reception if money was deducted." });
    }

    const paidAt = new Date();
    const receiptId = `RCT${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
    const booking = await Booking.findOneAndUpdate(
      { _id: paymentRecord.bookingId, userId: req.user._id, paymentStatus: { $ne: "Paid" } },
      { $set: { paymentStatus: "Paid", paymentMethod: gatewayPayment.method === "upi" ? "upi" : "online", paymentDate: paidAt, paidAt, receiptId, receiptNumber: paymentId } },
      { new: true }
    );
    await Payment.findByIdAndUpdate(paymentRecord._id, { status: "paid", method: gatewayPayment.method === "upi" ? "upi" : "online", transactionId: paymentId, razorpayPaymentId: paymentId, razorpaySignature: signature, receiptId, receiptNumber: paymentId, paymentDate: paidAt, paidAt });
    if (booking) await notifyPaymentReceived(booking, paymentId);
    res.json({ message: "Payment completed successfully", booking: booking || await Booking.findById(paymentRecord.bookingId) });
  } catch (error) {
    res.status(502).json({ message: "Unable to verify payment. Please contact reception if money was deducted." });
  }
};

module.exports = { createPaymentOrder, verifyPayment };
