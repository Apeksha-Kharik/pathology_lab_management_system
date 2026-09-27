const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
let messages;
let textMessages;
let failSend;
let captured = true;
const servicePath = require.resolve("../services/whatsappService");
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {
  sendWhatsAppMessage: async (message) => { textMessages.push(message); return { sent: true }; },
  sendWhatsAppDocument: async (message) => {
    if (failSend) throw new Error("Provider unavailable");
    messages.push(message);
    return { sent: true };
  }
} };
const gatewayPath = require.resolve("../services/razorpayService");
require.cache[gatewayPath] = { id: gatewayPath, filename: gatewayPath, loaded: true, exports: {
  fetchPayment: async () => ({ order_id: "order_test", currency: "INR", amount: 50000, status: captured ? "captured" : "authorized", method: "upi" })
} };
const { notifyBookingRequested, notifyPaymentReceived } = require("../services/patientNotifications");
const { updateSampleStatus } = require("../controllers/technicianController");
const { verifyPayment } = require("../controllers/paymentController");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const booking = { _id: "booking", name: "Patient", phone: "9876543210", testName: "CBC Test", bookingCode: "BK1024", amount: 500, paymentStatus: "Paid", receiptId: "RCT123" };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
beforeEach(() => { messages = []; textMessages = []; failSend = false; captured = true; });

test("booking request sends an acknowledgement with booking details", async () => {
  await notifyBookingRequested({ ...booking, bookingDate: "2026-10-01", timeSlot: "09:00-10:00" });
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].to, booking.phone);
  assert.equal(textMessages[0].event, "booking_requested");
  assert.deepEqual(textMessages[0].parameters.slice(0, 3), ["Patient", "BK1024", "CBC Test"]);
  assert.match(textMessages[0].body, /receptionist will confirm or reject/);
});

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
  process.env.RAZORPAY_KEY_SECRET = "test-secret";
  t.after(() => { if (original === undefined) delete process.env.RAZORPAY_KEY_SECRET; else process.env.RAZORPAY_KEY_SECRET = original; });
  const record = { _id: "payment", bookingId: "booking", amount: 500, status: "pending" };
  t.mock.method(Payment, "findOne", async () => record);
  t.mock.method(Payment, "findByIdAndUpdate", async () => { record.status = "paid"; });
  t.mock.method(Booking, "findOneAndUpdate", async () => booking);
  t.mock.method(Booking, "findById", async () => booking);
  const req = { user: { _id: "patient" }, params: { bookingId: "booking" }, body: {
    razorpay_order_id: "order_test", razorpay_payment_id: "PAY123",
    razorpay_signature: crypto.createHmac("sha256", "test-secret").update("order_test|PAY123").digest("hex")
  } };
  captured = false;
  const rejected = response();
  await verifyPayment(req, rejected);
  assert.equal(rejected.code, 409);
  assert.equal(messages.length, 0);
  captured = true;
  await verifyPayment(req, response());
  await verifyPayment(req, response());
  assert.equal(messages.length, 1);
  assert.equal(messages[0].event, "payment_received");
});
