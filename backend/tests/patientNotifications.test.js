const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
let messages;
let textMessages;
let failSend;
let failText;
let captured = true;
const servicePath = require.resolve("../services/whatsappService");
require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {
  sendWhatsAppMessage: async (message) => { if (failText) throw new Error("Provider unavailable"); textMessages.push(message); return { sent: true }; },
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
const { notifyBookingRequested, notifyBookingConfirmed, notifyReportReady, notifyPaymentReceived } = require("../services/patientNotifications");
const { updateSampleStatus } = require("../controllers/technicianController");
const { verifyPayment } = require("../controllers/paymentController");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const booking = { _id: "booking", name: "Patient", phone: "9876543210", testName: "CBC Test", bookingCode: "BK1024", amount: 500, paymentStatus: "Paid", receiptId: "RCT123" };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
beforeEach(() => { messages = []; textMessages = []; failSend = false; failText = false; captured = true; });

test("booking request sends an acknowledgement with booking details", async () => {
  await notifyBookingRequested({ ...booking, bookingDate: "2026-10-01", timeSlot: "09:00-10:00" });
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].to, booking.phone);
  assert.equal(textMessages[0].event, "booking_requested");
  assert.deepEqual(textMessages[0].parameters.slice(0, 3), ["Patient", "BK1024", "CBC Test"]);
  assert.match(textMessages[0].body, /receptionist will confirm or reject/);
});

test("payment sends plain-text receipt details to patient", async () => {
  await notifyPaymentReceived(booking);
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].to, booking.phone);
  assert.equal(textMessages[0].event, "payment_received");
  assert.match(textMessages[0].body, /RCT123/);
  assert.match(textMessages[0].body, /INR 500.00/);
  assert.equal(messages.length, 0);
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
  assert.equal(textMessages.length, 0);
  captured = true;
  await verifyPayment(req, response());
  await verifyPayment(req, response());
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].event, "payment_received");
});


test("receptionist confirmation sends once after save; repeated confirmation does not resend", async (t) => {
  const { updateBookingStatus } = require("../controllers/receptionistController");
  const User = require("../models/User");
  let saved = false;
  const record = { ...booking, patientCode: "PID1", bookingStatus: "Pending Approval", bookingDate: "2026-10-12", timeSlot: "09:00", save: async () => { saved = true; } };
  t.mock.method(Booking, "findById", () => ({ populate: async () => record }));
  t.mock.method(Booking, "countDocuments", async () => 0);
  t.mock.method(User, "countDocuments", async () => 1);
  const req = { params: { id: "booking" }, body: { status: "Confirmed" } };
  const res = response();
  await updateBookingStatus(req, res);
  assert.equal(saved, true);
  assert.equal(res.code, 200);
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].to, booking.phone);
  assert.equal(textMessages[0].event, "booking_confirmed");
  assert.deepEqual(textMessages[0].parameters.slice(0, 3), ["Patient", "PID1", "BK1024"]);
  await updateBookingStatus(req, response());
  assert.equal(textMessages.length, 1);
});

test("confirmation provider failures are contained", async () => {
  failText = true;
  assert.equal((await notifyBookingConfirmed(booking)).sent, false);
});

test("ready report sends plain text to booking patient", async () => {
  await notifyReportReady({ status: "Approved", bookingId: booking, userId: { phone: "9999999999" }, testName: "CBC Test", results: [] });
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].event, "report_ready");
  assert.equal(textMessages[0].to, booking.phone);
  assert.match(textMessages[0].body, /report has been approved and is ready/);
  assert.equal(messages.length, 0);
});

test("unapproved report does not send", async () => {
  assert.equal((await notifyReportReady({ status: "Pending Approval", bookingId: booking })).sent, false);
  assert.equal(textMessages.length, 0);
});


test("rejection sends plain text once after saved decision", async (t) => {
  const { updateBookingStatus } = require("../controllers/receptionistController");
  const record = { ...booking, bookingStatus: "Pending Approval", save: async () => {} };
  t.mock.method(Booking, "findById", () => ({ populate: async () => record }));
  const req = { params: { id: "booking" }, body: { status: "Rejected", rejectionReason: "Slot unavailable" } };
  await updateBookingStatus(req, response());
  await updateBookingStatus(req, response());
  assert.equal(textMessages.length, 1);
  assert.equal(textMessages[0].event, "booking_rejected");
  assert.equal(textMessages[0].to, booking.phone);
  assert.match(textMessages[0].body, /Slot unavailable/);
});
