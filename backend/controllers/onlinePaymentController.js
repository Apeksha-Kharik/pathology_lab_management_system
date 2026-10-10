const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const patientNotifications = require("../services/patientNotifications");
const {
  paymentError, payableStatuses, canPayOnline, amountInPaise,
  validSignature, requireKeys, razorpayRequest, validateCapturedPayment
} = require("../services/razorpayService");

const ownedBooking = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw paymentError("Booking not found", 404);
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) throw paymentError("Booking not found", 404);
  return booking;
};

// The booking is the authoritative payment state. Repeated callbacks also repair
// the Payment projection if an earlier database write was interrupted.
const recordCapturedPayment = async (booking, payment) => {
  validateCapturedPayment(booking, payment);
  const paidAt = new Date();
  const receiptId = `RP-${payment.id}`;
  const updated = await Booking.findOneAndUpdate({
    _id: booking._id,
    razorpayOrderId: payment.order_id,
    paymentPreference: "online",
    bookingStatus: { $in: payableStatuses },
    paymentStatus: { $in: ["Unpaid", "Failed"] }
  }, { $set: {
    paymentStatus: "Paid", paymentMethod: "razorpay", razorpayPaymentId: payment.id,
    paidAt, paymentDate: paidAt, receiptId, receiptNumber: receiptId
  } }, { new: true });
  const paidBooking = updated || await Booking.findById(booking._id);
  if (paidBooking?.paymentStatus !== "Paid" || paidBooking.razorpayPaymentId !== payment.id) {
    throw paymentError("Payment requires laboratory review. Do not pay again.", 409);
  }
  // Every patient booking already has a Payment record; no concurrent upserts.
  const record = await Payment.findOneAndUpdate({ bookingId: paidBooking._id }, { $set: {
    userId: paidBooking.userId, amount: paidBooking.amount, method: "razorpay", status: "paid",
    transactionId: payment.id, gateway: "razorpay", razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id,
    receiptId: paidBooking.receiptId, receiptNumber: paidBooking.receiptNumber,
    paidAt: paidBooking.paidAt, paymentDate: paidBooking.paymentDate
  } }, { new: true });
  if (!record) throw paymentError("Payment received; billing record needs laboratory review. Do not pay again.", 409);
  if (updated) {
    // Receipt delivery must never undo a verified payment.
    await patientNotifications.notifyPaymentReceived(paidBooking, payment.id).catch(() => {});
  }
  return paidBooking;
};

const handleError = (res, error) => {
  if (!error.status) console.error("Online payment processing failed:", error.name);
  res.status(error.status || 503).json({ message: error.status ? error.message : "Unable to confirm payment right now. If debited, do not pay again; refresh shortly or contact the laboratory." });
};

const createOrder = async (req, res) => {
  let lock;
  let booking;
  try {
    booking = await ownedBooking(req);
    if (!canPayOnline(booking)) throw paymentError("Online payment is available only for confirmed, unpaid online bookings", 409);
    requireKeys();
    if (!booking.razorpayOrderId) {
      lock = crypto.randomUUID();
      const locked = await Booking.findOneAndUpdate({
        _id: booking._id, paymentPreference: "online", paymentStatus: { $in: ["Unpaid", "Failed"] },
        bookingStatus: { $in: payableStatuses }, razorpayOrderId: { $exists: false },
        $or: [{ paymentOrderLockUntil: { $exists: false } }, { paymentOrderLockUntil: { $lt: new Date() } }]
      }, { $set: { paymentOrderLock: lock, paymentOrderLockUntil: new Date(Date.now() + 60000) } }, { new: true });
      if (!locked) throw paymentError("Payment is being prepared. Please retry shortly.", 409);
      const order = await razorpayRequest("/orders", {
        amount: amountInPaise(locked.amount), currency: "INR", receipt: String(locked._id), partial_payment: false
      });
      booking = await Booking.findOneAndUpdate({ _id: locked._id, paymentOrderLock: lock }, {
        $set: { razorpayOrderId: order.id, razorpayMode: "test" }, $unset: { paymentOrderLock: 1, paymentOrderLockUntil: 1 }
      }, { new: true });
      if (!booking) throw paymentError("Payment preparation expired. Please retry.", 409);
    }
    // Reuse one order across retries and browser tabs. A captured payment is
    // reconciled before opening another checkout after a lost browser callback.
    const payments = await razorpayRequest(`/orders/${encodeURIComponent(booking.razorpayOrderId)}/payments`);
    const captured = payments.items?.find((payment) => payment.status === "captured");
    if (captured) return res.json({ booking: await recordCapturedPayment(booking, captured), paid: true });
    if (payments.items?.some((payment) => payment.status === "authorized")) {
      throw paymentError("Your payment is awaiting capture. Do not pay again; check back shortly.", 409);
    }
    res.json({ key: process.env.RAZORPAY_KEY_ID, keyId: process.env.RAZORPAY_KEY_ID,
      orderId: booking.razorpayOrderId, amount: amountInPaise(booking.amount), currency: "INR", mode: "test",
      booking: { id: booking._id, code: booking.bookingCode, name: booking.name, email: booking.email, phone: booking.phone }
    });
  } catch (error) {
    handleError(res, error);
  } finally {
    if (lock && req.params.id) await Booking.updateOne({ _id: req.params.id, paymentOrderLock: lock }, {
      $unset: { paymentOrderLock: 1, paymentOrderLockUntil: 1 }
    }).catch(() => {});
  }
};

const verifyPayment = async (req, res) => {
  try {
    const booking = await ownedBooking(req);
    requireKeys();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!booking.razorpayOrderId || razorpay_order_id !== booking.razorpayOrderId
      || typeof razorpay_payment_id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(razorpay_payment_id)
      || !validSignature(`${booking.razorpayOrderId}|${razorpay_payment_id}`, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) {
      throw paymentError("Payment verification failed");
    }
    const payment = await razorpayRequest(`/payments/${encodeURIComponent(razorpay_payment_id)}`);
    res.json({ booking: await recordCapturedPayment(booking, payment), message: "Payment received" });
  } catch (error) { handleError(res, error); }
};

const paymentWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) throw paymentError("Webhook not configured", 503);
    if (!Buffer.isBuffer(req.body) || !validSignature(req.body, req.get("x-razorpay-signature"), process.env.RAZORPAY_WEBHOOK_SECRET)) {
      throw paymentError("Invalid webhook signature");
    }
    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id || !payment.id) throw paymentError("Invalid payment event");
      const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
      if (booking) {
        // Fetch with Test Mode credentials too, preventing a Live Mode webhook
        // from being mistaken for a test payment if dashboard setup is wrong.
        const verifiedPayment = await razorpayRequest(`/payments/${encodeURIComponent(payment.id)}`);
        await recordCapturedPayment(booking, verifiedPayment);
      }
    }
    res.json({ received: true });
  } catch (error) { handleError(res, error); }
};

module.exports = { createOrder, verifyPayment, paymentWebhook };
