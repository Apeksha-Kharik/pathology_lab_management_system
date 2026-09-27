const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
let messages;
let failSend;
let captured = true;
const servicePath = require.resolve("../services/whatsappService");
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {
  sendWhatsAppDocument: async (message) => {
    if (failSend) throw new Error("Provider unavailable");
    messages.push(message);
    return { sent: true };
  }
} };
const gatewayPath = require.resolve("../services/razorpayService");
const gatewayService = require(gatewayPath);
require.cache[gatewayPath] = { id: gatewayPath, filename: gatewayPath, loaded: true, exports: {
  ...gatewayService,
  razorpayRequest: async () => ({ id: "pay_test123", order_id: "order_test", currency: "INR", amount: 50000, status: captured ? "captured" : "authorized", method: "upi" })
} };
const { notifyPaymentReceived } = require("../services/patientNotifications");
const { updateSampleStatus } = require("../controllers/technicianController");
const { verifyPayment } = require("../controllers/paymentController");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const booking = { _id: "booking", name: "Patient", phone: "9876543210", testName: "CBC Test", bookingCode: "BK1024", amount: 500, paymentStatus: "Paid", receiptId: "RCT123" };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
beforeEach(() => { messages = []; failSend = false; captured = true; });

test("payment sends one receipt PDF with amount", async () => {
  await notifyPaymentReceived(booking, "PAY123");
  await notifyPaymentReceived(booking);
  assert.equal(messages[0].buffer.subarray(0, 4).toString(), "%PDF");
  assert.match(messages[0].filename, /RCT.pdf$/);
  assert.equal(messages[1].event, "payment_received");
  assert.equal(messages[0].parameters[2], "INR 500.00");
});

test("sample collection saves without routine WhatsApp messages", async (t) => {
  let saved = false;
  const sample = { ...booking, sampleStatus: "Not Collected", save: async () => { saved = true; } };
  t.mock.method(Booking, "findOne", async () => sample);
  const req = { params: { bookingId: "booking" }, user: { _id: "technician" }, body: { status: "Sample Collected" } };
  const res = response();
  await updateSampleStatus(req, res);
  assert.equal(saved, true);
  assert.equal(res.code, 200);
  assert.equal(messages.length, 0);
  await updateSampleStatus(req, response());
  assert.equal(messages.length, 0);
});

test("failed sample save sends no notification", async (t) => {
  t.mock.method(Booking, "findOne", async () => ({ ...booking, save: async () => { throw new Error("Database unavailable"); } }));
  const res = response();
  await updateSampleStatus({ params: {}, user: {}, body: { status: "Sample Collected" } }, res);
  assert.equal(res.code, 500);
  assert.equal(messages.length, 0);
});

test("provider failure does not fail sample collection", async (t) => {
  failSend = true;
  t.mock.method(Booking, "findOne", async () => ({ ...booking, save: async () => {} }));
  const res = response();
  await updateSampleStatus({ params: {}, user: {}, body: { status: "Sample Collected" } }, res);
  assert.equal(res.code, 200);
});

test("online payment notifies only after captured, verified payment; retries do not resend", async (t) => {
  const original = process.env.RAZORPAY_KEY_SECRET;
  const originalId = process.env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_ID = "rzp_test_notifications";
  process.env.RAZORPAY_KEY_SECRET = "test-secret";
  t.after(() => { if (originalId === undefined) delete process.env.RAZORPAY_KEY_ID; else process.env.RAZORPAY_KEY_ID = originalId; });
  t.after(() => { if (original === undefined) delete process.env.RAZORPAY_KEY_SECRET; else process.env.RAZORPAY_KEY_SECRET = original; });
  const pendingBooking = { ...booking, _id: "507f1f77bcf86cd799439011", paymentStatus: "Unpaid", bookingStatus: "Confirmed", paymentPreference: "online", razorpayOrderId: "order_test" };
  const record = { _id: "payment", bookingId: pendingBooking._id, amount: 500, status: "pending" };
  t.mock.method(Payment, "findOneAndUpdate", async (query, update) => { Object.assign(record, update.$set); return record; });
  t.mock.method(Booking, "findOne", async () => pendingBooking);
  t.mock.method(Booking, "findOneAndUpdate", async (query, update) => {
    if (pendingBooking.paymentStatus === "Paid") return null;
    Object.assign(pendingBooking, update.$set);
    return pendingBooking;
  });
  t.mock.method(Booking, "findById", async () => pendingBooking);
  const req = { user: { _id: "patient" }, params: { bookingId: pendingBooking._id }, body: {
    razorpay_order_id: "order_test", razorpay_payment_id: "pay_test123",
    razorpay_signature: crypto.createHmac("sha256", "test-secret").update("order_test|pay_test123").digest("hex")
  } };
  captured = false;
  const rejected = response();
  await verifyPayment(req, rejected);
  assert.equal(rejected.code, 409);
  assert.equal(messages.length, 0);
  captured = true;
  const first = response();
  await verifyPayment(req, first);
  assert.equal(first.code, 200);
  const repeated = response();
  await verifyPayment(req, repeated);
  assert.equal(repeated.code, 200);
  assert.equal(record.status, "paid");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].event, "payment_received");
});
