const crypto = require("node:crypto");
const Razorpay = require("razorpay");

const paymentError = (message, status = 400) => Object.assign(new Error(message), { status });
const payableStatuses = ["Confirmed", "Arrived"];
const canPayOnline = (booking) => booking.paymentPreference === "online"
  && payableStatuses.includes(booking.bookingStatus || booking.status)
  && ["Unpaid", "Failed"].includes(booking.paymentStatus);

const amountInPaise = (amount) => {
  const value = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(value) || value <= 0) throw paymentError("Invalid booking amount");
  if (value < 100) throw paymentError("Online payment amount must be at least INR 1 (100 paise)");
  return value;
};

const validSignature = (payload, signature, secret) => {
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
};

const requireKeys = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw paymentError("Online payment is not configured yet. Please contact the laboratory.", 503);
  }
  if (!process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw paymentError("Only Razorpay Test Mode is enabled. Configure Test Mode keys on the backend.", 503);
  }
};

const razorpayRequest = async (path, body) => {
  requireKeys();
  const client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  client.api.rq.defaults.timeout = 20000;
  try {
    if (path === "/orders" && body) return await client.orders.create(body);
    const orderPayments = path.match(/^\/orders\/(order_[A-Za-z0-9]+)\/payments$/);
    if (orderPayments) return await client.orders.fetchPayments(orderPayments[1]);
    const payment = path.match(/^\/payments\/(pay_[A-Za-z0-9]+)$/);
    if (payment) return await client.payments.fetch(payment[1]);
    throw new Error("Unsupported Razorpay request");
  } catch {
    throw paymentError("Payment provider unavailable. Please try again shortly.", 502);
  }
};

const validateCapturedPayment = (booking, payment) => {
  if (payment.order_id !== booking.razorpayOrderId || payment.currency !== "INR"
      || payment.amount !== amountInPaise(booking.amount)) {
    throw paymentError("Payment does not match this booking");
  }
  if (payment.status !== "captured") throw paymentError("Payment is awaiting confirmation. Do not pay again; refresh shortly.", 409);
};

module.exports = { paymentError, payableStatuses, canPayOnline, amountInPaise, validSignature, requireKeys, razorpayRequest, validateCapturedPayment };
