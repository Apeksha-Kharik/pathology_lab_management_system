const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const Report = require('../models/Report');
const User = require('../models/User');
const notifications = require.resolve('../services/patientNotifications');
require.cache[notifications] = { id: notifications, filename: notifications, loaded: true, exports: { notifySampleCollected: async () => {} } };
const { saveReportDraft, submitReport } = require('../controllers/technicianController');
let booking, existing, writes;
beforeEach(t => {
  writes = [];
  existing = null;
  booking = { _id: 'booking', userId: 'patient', testName: 'Example', testStarted: true, bookingStatus: 'Processing',
    testId: { reportTemplate: [{ parameter: 'A', unit: 'unit', referenceRange: 'range' }, { parameter: 'B', unit: '', referenceRange: '' }] },
    async populate() {}, async save() {} };
  t.mock.method(Booking, 'findOne', async () => booking);
  t.mock.method(Report, 'findOne', async () => existing);
  t.mock.method(Report, 'findOneAndUpdate', async (query, data) => { writes.push(data); return data; });
  t.mock.method(User, 'find', () => ({ select: () => ({ sort: async () => [{ _id: 'doctor', name: 'Doctor' }] }) }));
  t.mock.method(Report, 'aggregate', async () => []);
  t.mock.method(Report, 'find', () => ({ select: () => ({ sort: async () => [] }) }));
});
async function call(handler, results) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ params: { bookingId: 'booking' }, user: { _id: 'technician' }, body: { results } }, res);
  return res;
}
test('partial draft saves zero and admin metadata, preserving result status', async () => {
  const res = await call(saveReportDraft, [{ parameter: 'A', value: 0, unit: 'tampered', status: 'Low' }]);
  assert.equal(res.code, 200);
  assert.deepEqual(writes[0].results[0], { parameter: 'A', value: '0', unit: 'unit', referenceRange: 'range', normalRange: 'range', status: 'Low' });
  assert.equal(writes[0].status, 'Draft');
});
test('incomplete submission fails without saving', async () => {
  const res = await call(submitReport, [{ parameter: 'A', value: '1' }]);
  assert.equal(res.code, 400);
  assert.match(res.data.message, /B/);
  assert.equal(writes.length, 0);
});
test('thyroid booking rejects a hemoglobin-only result without saving', async () => {
  booking.testName = 'Thyroid Function Test (TFT)';
  booking.testId.reportTemplate = [
    { parameter: 'T3', unit: 'ng/dL' },
    { parameter: 'T4', unit: 'ug/dL' },
    { parameter: 'TSH', unit: 'uIU/mL' }
  ];
  const res = await call(submitReport, [{ parameter: 'Haemoglobin', value: '10', unit: 'mg' }]);
  assert.equal(res.code, 400);
  assert.match(res.data.message, /T3, T4, TSH/);
  assert.equal(writes.length, 0);
});
test('complete package results go to a pathologist in template order', async () => {
  booking.packageId = booking.testId;
  booking.testId = null;
  booking.bookingType = 'Package';
  const res = await call(submitReport, [{ parameter: 'B', value: 'Negative' }, { parameter: 'A', value: '1' }]);
  assert.equal(res.code, 200);
  assert.deepEqual(writes[0].results.map(row => row.parameter), ['A', 'B']);
  assert.equal(writes[0].pathologistId, 'doctor');
  assert.equal(writes[0].status, 'Pending Approval');
  assert.equal(booking.bookingStatus, 'Pending Report Approval');
});
test('draft and submission require the test to be started', async () => {
  booking.testStarted = false;
  booking.bookingStatus = 'Technician Assigned';
  for (const handler of [saveReportDraft, submitReport]) assert.equal((await call(handler, [{ parameter: 'A', value: '1' }])).code, 400);
  assert.equal(writes.length, 0);
});
test('approved reports cannot be overwritten', async () => {
  existing = { status: 'Approved' };
  for (const handler of [saveReportDraft, submitReport]) assert.equal((await call(handler, [{ parameter: 'A', value: '1' }, { parameter: 'B', value: '2' }])).code, 400);
  assert.equal(writes.length, 0);
});
