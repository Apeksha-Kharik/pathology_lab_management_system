const { test } = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const User = require('../models/User');
const TechnicianAssignment = require('../models/TechnicianAssignment');
const { updateBookingStatus, assignTechnician } = require('../controllers/receptionistController');

const invoke = async (extra = {}) => {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await updateBookingStatus({ params: { id: '507f1f77bcf86cd799439011' }, body: { status: 'Confirmed', ...extra } }, res);
  return res;
};

for (const fields of [{ status: 'Pending' }, { status: 'Pending Approval' }, {}, { bookingStatus: 'Pending Approval', status: 'Pending Approval' }]) {
  test(`confirmation supports stored status fields: ${JSON.stringify(fields)}`, async t => {
    const stored = { _id: '507f1f77bcf86cd799439011', bookingDate: '2026-10-17', timeSlot: '09:00 AM', ...fields };
    t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
    t.mock.method(User, 'countDocuments', async () => 2);
    t.mock.method(Booking, 'countDocuments', async () => 0);
    t.mock.method(Booking, 'updateOne', async (query, update) => {
      assert.equal(query.bookingStatus, stored.bookingStatus ?? null);
      assert.equal(query.status, stored.status ?? null);
      assert.equal(update.$set.bookingStatus, 'Confirmed');
      return { modifiedCount: 1 };
    });
    const res = await invoke();
    assert.equal(res.code, 200);
    assert.equal(res.body.booking.bookingStatus, 'Confirmed');
  });
}

test('concurrent booking changes still prevent confirmation', async t => {
  t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439011', bookingDate: '2026-10-17', timeSlot: '09:00 AM', bookingStatus: 'Pending Approval' }) }) }));
  t.mock.method(User, 'countDocuments', async () => 2);
  t.mock.method(Booking, 'countDocuments', async () => 0);
  t.mock.method(Booking, 'updateOne', async () => ({ modifiedCount: 0 }));
  assert.equal((await invoke()).code, 409);
});

test('arrival after technician acceptance keeps the assigned workflow status', async t => {
  const stored = { _id: '507f1f77bcf86cd799439011', bookingStatus: 'Technician Assigned', status: 'Technician Assigned', patientCode: 'PID1' };
  t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
  t.mock.method(Booking, 'updateOne', async (query, update) => {
    assert.equal(update.$set.bookingStatus, 'Technician Assigned');
    assert.equal(update.$set.patientArrived, true);
    return { modifiedCount: 1 };
  });
  assert.equal((await invoke({ status: 'Arrived' })).code, 200);
});

test('paid confirmed booking sends technician request before arrival', async t => {
  const booking = { _id: '507f1f77bcf86cd799439011', bookingStatus: 'Confirmed', paymentStatus: 'Paid', patientArrived: false };
  const technician = { _id: '507f1f77bcf86cd799439012', name: 'Test Technician' };
  t.mock.method(Booking, 'findById', async () => booking);
  t.mock.method(Booking, 'find', () => ({ select: async () => [] }));
  t.mock.method(Booking, 'aggregate', async () => []);
  t.mock.method(TechnicianAssignment, 'exists', async () => false);
  t.mock.method(TechnicianAssignment, 'findOne', async () => null);
  t.mock.method(TechnicianAssignment, 'distinct', async () => []);
  t.mock.method(TechnicianAssignment, 'aggregate', async () => []);
  t.mock.method(TechnicianAssignment, 'find', () => ({ select: () => ({ sort: async () => [] }) }));
  t.mock.method(User, 'find', () => ({ select: () => ({ sort: async () => [technician] }) }));
  t.mock.method(TechnicianAssignment, 'create', async data => {
    assert.equal(data.technician, technician._id);
    assert.equal(data.status, 'PENDING');
    return { ...data, populate: async () => {} };
  });
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await assignTechnician({ params: { id: booking._id }, user: { _id: 'receptionist' } }, res);
  assert.equal(res.code, 201);
  assert.equal(booking.patientArrived, false);
});

test('database hydration preserves progressed legacy status rather than showing pending', () => {
  for (const status of ['Confirmed', 'Processing', 'Report Ready', 'Rejected']) {
    assert.equal(Booking.hydrate({ status }).bookingStatus, status);
  }
  assert.equal(Booking.hydrate({ status: 'Pending' }).bookingStatus, 'Pending Approval');
});

test('incomplete legacy appointment requires explicit details before any write', async t => {
  const stored = { _id: '507f1f77bcf86cd799439011', status: 'Pending' };
  t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
  t.mock.method(Booking, 'updateOne', async () => assert.fail('unexpected write'));
  assert.equal((await invoke()).code, 400);
});

test('receptionist can complete legacy appointment and confirm with the same atomic write', async t => {
  const stored = { _id: '507f1f77bcf86cd799439011', status: 'Pending' };
  t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
  t.mock.method(User, 'countDocuments', async () => 2);
  t.mock.method(Booking, 'countDocuments', async query => {
    assert.equal(query.timeSlot, '09:00 AM - 11:00 AM');
    assert.equal(query.bookingDate, '2026-10-18');
    return 0;
  });
  t.mock.method(Booking, 'updateOne', async (query, update) => {
    assert.equal(query.bookingStatus, null);
    assert.equal(query.status, 'Pending');
    assert.equal(update.$set.timeSlot, '09:00 AM - 11:00 AM');
    assert.equal(update.$set.bookingStatus, 'Confirmed');
    return { modifiedCount: 1 };
  });
  assert.equal((await invoke({ bookingDate: '2026-10-18', timeSlot: '09:00 AM - 11:00 AM' })).code, 200);
});

test('confirmation unlocks payment when appointment capacity is available', async t => {
  const stored = { _id: '507f1f77bcf86cd799439011', bookingDate: '2026-10-17', timeSlot: '09:00 AM', bookingStatus: 'Pending Approval', status: 'Pending Approval', paymentPreference: 'online', paymentStatus: 'Unpaid' };
  t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
  t.mock.method(User, 'countDocuments', async () => 2);
  t.mock.method(Booking, 'countDocuments', async () => 1);
  t.mock.method(Booking, 'updateOne', async (query, update) => {
    assert.equal(update.$set.bookingStatus, 'Confirmed');
    assert.equal(update.$set.status, 'Confirmed');
    return { modifiedCount: 1 };
  });
  const res = await invoke();
  assert.equal(res.code, 200);
  assert.equal(res.body.booking.bookingStatus, 'Confirmed');
  assert.equal(res.body.booking.paymentPreference, 'online');
  assert.equal(res.body.booking.paymentStatus, 'Unpaid');
});

for (const [technicians, reserved] of [[0, 0], [1, 1], [2, 3]]) {
  test(`confirmation blocks unavailable appointment capacity (${technicians}, ${reserved})`, async t => {
    const stored = { _id: '507f1f77bcf86cd799439011', bookingDate: '2026-10-22', timeSlot: '10:00 AM', bookingStatus: 'Pending Approval' };
    t.mock.method(Booking, 'findById', () => ({ populate: () => ({ lean: async () => ({ ...stored }) }) }));
    t.mock.method(User, 'countDocuments', async () => technicians);
    t.mock.method(Booking, 'countDocuments', async query => {
      assert.equal(query.bookingDate, stored.bookingDate);
      assert.equal(query.timeSlot, stored.timeSlot);
      assert.deepEqual(query._id, { $ne: stored._id });
      return reserved;
    });
    t.mock.method(Booking, 'updateOne', async () => assert.fail('clashing booking must not be confirmed or rejected automatically'));
    const res = await invoke();
    assert.equal(res.code, 409);
    assert.match(res.body.message, /Cannot confirm/);
    assert.match(res.body.message, /remains pending/);
  });
}
