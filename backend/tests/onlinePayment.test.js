const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { mock } = require('node:test');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const service = require('../services/razorpayService');
const Test = require('../models/Test');

const bookingId = '507f1f77bcf86cd799439011';
const patientId = '507f1f77bcf86cd799439012';
const originalEnv = { ...process.env };
afterEach(() => {
  mock.restoreAll();
  for (const name of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

const bookingData = (overrides = {}) => ({
  _id: bookingId, userId: patientId, amount: 199.99, paymentPreference: 'online',
  bookingStatus: 'Confirmed', paymentStatus: 'Unpaid', razorpayOrderId: 'order_test123', ...overrides
});
const captured = (overrides = {}) => ({
  id: 'pay_test123', order_id: 'order_test123', currency: 'INR', amount: 19999, status: 'captured', ...overrides
});
const sign = (payload, secret = 'unit-test-secret-not-a-real-key') => crypto.createHmac('sha256', secret).update(payload).digest('hex');
const request = (body = {}) => ({ params: { id: bookingId }, user: { _id: patientId }, body });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

function setup(overrides = {}) {
  mock.method(require('../services/patientNotifications'), 'notifyPaymentReceived', async () => ({ sent: true }));
  process.env.RAZORPAY_KEY_ID = 'rzp_test_unitTests';
  process.env.RAZORPAY_KEY_SECRET = 'unit-test-secret-not-a-real-key';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'unit-test-webhook-secret';
  const state = { booking: bookingData(overrides), updates: 0, paymentWrites: 0, requests: [] };
  mock.method(Booking, 'findOne', async (query) => {
    if (query.userId && String(query.userId) !== String(state.booking.userId)) return null;
    if (query.razorpayOrderId && query.razorpayOrderId !== state.booking.razorpayOrderId) return null;
    return { ...state.booking };
  });
  mock.method(Booking, 'findById', async () => ({ ...state.booking }));
  mock.method(Booking, 'findOneAndUpdate', async (query, change) => {
    if (query.paymentStatus && !query.paymentStatus.$in.includes(state.booking.paymentStatus)) return null;
    if (query.bookingStatus && !query.bookingStatus.$in.includes(state.booking.bookingStatus)) return null;
    if (query.razorpayOrderId?.$exists === false && state.booking.razorpayOrderId) return null;
    if (query.$or && state.booking.paymentOrderLockUntil > new Date()) return null;
    if (query.paymentOrderLock && query.paymentOrderLock !== state.booking.paymentOrderLock) return null;
    state.updates++;
    Object.assign(state.booking, change.$set);
    for (const key of Object.keys(change.$unset || {})) delete state.booking[key];
    return { ...state.booking };
  });
  mock.method(Booking, 'updateOne', async () => ({ modifiedCount: 1 }));
  mock.method(Payment, 'findOneAndUpdate', async (query, change) => {
    assert.equal(query.bookingId, bookingId);
    state.paymentWrites++;
    state.payment = { ...change.$set };
    return state.payment;
  });
  mock.method(service, 'razorpayRequest', async (path, body) => {
    state.requests.push({ path, body });
    if (path === '/orders') return { id: 'order_test123' };
    if (path.endsWith('/payments')) return { items: state.orderPayments || [] };
    return state.gatewayPayment || captured();
  });
  delete require.cache[require.resolve('../controllers/onlinePaymentController')];
  return { state, controller: require('../controllers/onlinePaymentController') };
}

test('paise conversion handles currency decimals and rejects invalid/minimum amounts', () => {
  assert.equal(service.amountInPaise(199.99), 19999);
  assert.equal(service.amountInPaise(1), 100);
  for (const value of [0, -1, NaN, Infinity, 'invalid', 0.99, Number.MAX_VALUE]) {
    assert.throws(() => service.amountInPaise(value));
  }
});

test('signature verification rejects malformed, mismatched and tampered data', () => {
  const payload = 'order_test123|pay_test123';
  assert.equal(service.validSignature(payload, sign(payload), 'unit-test-secret-not-a-real-key'), true);
  for (const signature of [undefined, '', 'xyz', 'a'.repeat(64), sign('different')]) {
    assert.equal(service.validSignature(payload, signature, 'unit-test-secret-not-a-real-key'), false);
  }
});

test('missing keys and live keys are rejected', () => {
  delete process.env.RAZORPAY_KEY_ID;
  assert.throws(service.requireKeys, /not configured/);
  process.env.RAZORPAY_KEY_ID = 'rzp_live_notAllowed';
  process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  assert.throws(service.requireKeys, /Only Razorpay Test Mode/);
});

for (const overrides of [
  { bookingStatus: 'Pending Approval' }, { bookingStatus: 'Rejected' },
  { bookingStatus: 'Cancelled' }, { bookingStatus: 'Completed' },
  { paymentStatus: 'Paid' }, { paymentStatus: 'Refunded' }, { paymentPreference: 'cash' }
]) {
  test(`order rejects ineligible booking ${JSON.stringify(overrides)}`, async () => {
    const { state, controller } = setup(overrides);
    const res = response();
    await controller.createOrder(request(), res);
    assert.equal(res.statusCode, 409);
    assert.equal(state.requests.length, 0);
    assert.equal(state.updates, 0);
  });
}

test('order rejects another patient and invalid or missing bookings', async () => {
  const { state, controller } = setup();
  const otherRequest = request();
  otherRequest.user._id = '507f1f77bcf86cd799439099';
  const otherRes = response();
  await controller.createOrder(otherRequest, otherRes);
  assert.equal(otherRes.statusCode, 404);
  const invalid = request();
  invalid.params.id = 'invalid';
  const invalidRes = response();
  await controller.createOrder(invalid, invalidRes);
  assert.equal(invalidRes.statusCode, 404);
  mock.method(Booking, 'findOne', async () => null);
  const missingRes = response();
  await controller.createOrder(request(), missingRes);
  assert.equal(missingRes.statusCode, 404);
  assert.equal(state.requests.length, 0);
});

test('order uses database amount, ignores client amount, saves order and exposes no secret', async () => {
  const { state, controller } = setup({ razorpayOrderId: undefined });
  const res = response();
  await controller.createOrder(request({ amount: 1 }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.requests[0].body.amount, 19999);
  assert.equal(state.requests[0].body.receipt, bookingId);
  assert.equal(state.booking.razorpayOrderId, res.body.orderId);
  assert.equal(res.body.mode, 'test');
  assert.equal(JSON.stringify(res.body).includes(process.env.RAZORPAY_KEY_SECRET), false);
  assert.equal(state.booking.paymentStatus, 'Unpaid');
});

test('order rejects amount below INR 1 before provider call', async () => {
  const { state, controller } = setup({ amount: 0.5, razorpayOrderId: undefined });
  const res = response();
  await controller.createOrder(request(), res);
  assert.equal(res.statusCode, 400);
  assert.equal(state.requests.length, 0);
});

test('retry reuses stored order and does not create another order', async () => {
  const { state, controller } = setup();
  const res = response();
  await controller.createOrder(request(), res);
  assert.equal(res.body.orderId, 'order_test123');
  assert.equal(state.requests.some(({ path }) => path === '/orders'), false);
});

test('simultaneous order requests reserve only one checkout order', async () => {
  const { state, controller } = setup({ razorpayOrderId: undefined });
  const first = response();
  const second = response();
  await Promise.all([controller.createOrder(request(), first), controller.createOrder(request(), second)]);
  assert.deepEqual([first.statusCode, second.statusCode].sort(), [200, 409]);
  assert.equal(state.requests.filter(({ path }) => path === '/orders').length, 1);
});

test('gateway failure does not mark booking paid', async () => {
  const { state } = setup({ razorpayOrderId: undefined });
  mock.method(service, 'razorpayRequest', async () => { throw service.paymentError('Provider unavailable', 502); });
  delete require.cache[require.resolve('../controllers/onlinePaymentController')];
  const controller = require('../controllers/onlinePaymentController');
  const res = response();
  await controller.createOrder(request(), res);
  assert.equal(res.statusCode, 502);
  assert.equal(state.booking.paymentStatus, 'Unpaid');
});

const successfulBody = () => ({
  razorpay_order_id: 'order_test123', razorpay_payment_id: 'pay_test123',
  razorpay_signature: sign('order_test123|pay_test123')
});

test('verified captured payment updates existing booking and receipt; duplicate callback is idempotent', async () => {
  const { state, controller } = setup();
  const first = response();
  await controller.verifyPayment(request(successfulBody()), first);
  assert.equal(first.statusCode, 200);
  assert.equal(state.booking.paymentStatus, 'Paid');
  assert.equal(state.booking.razorpayPaymentId, 'pay_test123');
  assert.equal(state.payment.transactionId, 'pay_test123');
  const paidAt = state.booking.paidAt;
  const second = response();
  await controller.verifyPayment(request(successfulBody()), second);
  assert.equal(second.statusCode, 200);
  assert.equal(state.updates, 1);
  assert.equal(state.booking.paidAt, paidAt);
});

test('invalid, incomplete or unrelated payment responses cannot update booking', async () => {
  const { state, controller } = setup();
  for (const body of [{}, { ...successfulBody(), razorpay_signature: 'a'.repeat(64) }, { ...successfulBody(), razorpay_order_id: 'order_other' }]) {
    const res = response();
    await controller.verifyPayment(request(body), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(state.requests.length, 0);
  assert.equal(state.updates, 0);
});

for (const gatewayOverride of [{ amount: 1 }, { currency: 'USD' }, { order_id: 'order_other' }, { status: 'authorized' }, { status: 'failed' }]) {
  test(`signature alone cannot mark mismatched/uncaptured payment paid ${JSON.stringify(gatewayOverride)}`, async () => {
    const { state, controller } = setup();
    state.gatewayPayment = captured(gatewayOverride);
    const res = response();
    await controller.verifyPayment(request(successfulBody()), res);
    assert.ok(res.statusCode >= 400);
    assert.equal(state.booking.paymentStatus, 'Unpaid');
  });
}

test('lost callback is reconciled before retry checkout', async () => {
  const { state, controller } = setup();
  state.orderPayments = [captured()];
  const res = response();
  await controller.createOrder(request(), res);
  assert.equal(res.body.paid, true);
  assert.equal(state.booking.paymentStatus, 'Paid');
});

test('authorized payment blocks another checkout while capture is pending', async () => {
  const { state, controller } = setup();
  state.orderPayments = [captured({ status: 'authorized' })];
  const res = response();
  await controller.createOrder(request(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(state.booking.paymentStatus, 'Unpaid');
});

test('webhook verifies raw bytes, ignores unrelated orders and tolerates duplicates', async () => {
  const { state, controller } = setup();
  const body = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: captured() } } }));
  const signature = sign(body, process.env.RAZORPAY_WEBHOOK_SECRET);
  const bad = response();
  await controller.paymentWebhook({ body, get: () => 'bad' }, bad);
  assert.equal(bad.statusCode, 400);
  assert.equal(state.updates, 0);
  for (let i = 0; i < 2; i++) {
    const res = response();
    await controller.paymentWebhook({ body, get: () => signature }, res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(state.updates, 1);
  assert.equal(state.booking.paymentStatus, 'Paid');
  const unknownBody = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: captured({ order_id: 'order_unknown' }) } } }));
  const ignored = response();
  await controller.paymentWebhook({ body: unknownBody, get: () => sign(unknownBody, process.env.RAZORPAY_WEBHOOK_SECRET) }, ignored);
  assert.equal(ignored.statusCode, 200);
  assert.equal(state.updates, 1);
});

test('partial database failure can be repaired by repeating verified callback', async () => {
  const { state, controller } = setup();
  const paymentWrite = Payment.findOneAndUpdate;
  mock.method(Payment, 'findOneAndUpdate', async () => { throw new Error('database unavailable'); });
  const failed = response();
  await controller.verifyPayment(request(successfulBody()), failed);
  assert.equal(failed.statusCode, 503);
  assert.equal(state.booking.paymentStatus, 'Paid');
  mock.method(Payment, 'findOneAndUpdate', paymentWrite);
  const retried = response();
  await controller.verifyPayment(request(successfulBody()), retried);
  assert.equal(retried.statusCode, 200);
  assert.equal(state.payment.status, 'paid');
  assert.equal(state.updates, 1);
});

test('patient booking persists online preference and catalog amount; invalid preference is rejected', async () => {
  const { createBooking } = require('../controllers/patientController');
  let savedBooking;
  let savedPayment;
  mock.method(Test, 'findById', async () => ({ _id: bookingId, testName: 'CBC', price: 450 }));
  mock.method(Booking, 'create', async (data) => { savedBooking = { _id: bookingId, ...data }; return savedBooking; });
  mock.method(Payment, 'create', async (data) => { savedPayment = data; return data; });
  const req = request({ testId: bookingId, bookingDate: '2026-10-01', timeSlot: '10:00', name: 'Test Patient', phone: '9999999999', age: 30, paymentPreference: 'online', amount: 1 });
  const res = response();
  await createBooking(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(savedBooking.paymentPreference, 'online');
  assert.equal(savedBooking.amount, 450);
  assert.equal(savedBooking.bookingStatus, 'Pending Approval');
  assert.equal(savedPayment.method, 'razorpay');
  assert.equal(savedPayment.amount, 450);
  const invalid = response();
  await createBooking(request({ paymentPreference: 'free' }), invalid);
  assert.equal(invalid.statusCode, 400);
});

test('receptionist cannot manually mark online payment paid', async () => {
  const { markPaymentPaid } = require('../controllers/receptionistController');
  const booking = bookingData();
  mock.method(Booking, 'findById', () => ({ populate: async () => booking }));
  const res = response();
  await markPaymentPaid(request({ paymentMethod: 'cash', amount: 199.99 }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(booking.paymentStatus, 'Unpaid');
});

test('receptionist confirmation unlocks online eligibility and cannot later reject confirmed booking', async () => {
  mock.method(require('../models/User'), 'countDocuments', async () => 1);
  mock.method(Booking, 'countDocuments', async () => 0);
  const whatsapp = require('../services/whatsappService');
  mock.method(whatsapp, 'sendWhatsAppMessage', async () => ({ sent: true }));
  delete require.cache[require.resolve('../controllers/receptionistController')];
  const { updateBookingStatus } = require('../controllers/receptionistController');
  const booking = bookingData({ bookingStatus: 'Pending Approval' });
  mock.method(Booking, 'findById', () => ({ populate: async () => booking }));
  mock.method(Booking, 'updateOne', async (query, update) => {
    assert.equal(query.bookingStatus, 'Pending Approval');
    assert.equal(update.$set.bookingStatus, 'Confirmed');
    return { modifiedCount: 1 };
  });
  const confirmed = response();
  await updateBookingStatus(request({ status: 'Confirmed' }), confirmed);
  assert.equal(confirmed.statusCode, 200);
  assert.equal(service.canPayOnline(booking), true);
  const rejected = response();
  await updateBookingStatus(request({ status: 'Rejected' }), rejected);
  assert.equal(rejected.statusCode, 409);
  assert.equal(booking.bookingStatus, 'Confirmed');
});
