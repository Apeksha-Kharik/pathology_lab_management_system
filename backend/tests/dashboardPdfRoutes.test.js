const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Report = require('../models/Report');
const Booking = require('../models/Booking');
let rendered;
const pdfPath = require.resolve('../services/patientPdfService');
require.cache[pdfPath] = { id: pdfPath, filename: pdfPath, loaded: true, exports: {
  renderReportPdf: report => { rendered = { kind: 'report', report }; },
  renderReceiptPdf: booking => { rendered = { kind: 'receipt', booking }; },
  buildPatientPdfFilename: () => 'document.pdf'
} };
const { downloadAdminReport } = require('../controllers/adminController');
const { downloadReceptionistReceipt } = require('../controllers/receptionistController');
const { getReportPdf } = require('../controllers/documentController');
let report, booking;
beforeEach(t => {
  rendered = null;
  booking = { _id: '507f1f77bcf86cd799439011', paymentStatus: 'Paid', receiptId: 'RCT1' };
  report = { _id: '507f1f77bcf86cd799439012', userId: 'patient', technicianId: 'technician', pathologistId: 'pathologist', bookingId: booking, status: 'Approved', results: [] };
  const query = { populate() { return this; }, then(resolve) { return Promise.resolve(report).then(resolve); } };
  t.mock.method(Report, 'findById', () => query);
  t.mock.method(Booking, 'findById', async () => booking);
});
async function call(handler, role = 'admin', id = role) {
  const res = { code: 200, headers: {}, listeners: {}, once(event, handler) { this.listeners[event] = handler; return this; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, setHeader(key, value) { this.headers[key] = value; } };
  await handler({ params: { id: booking?._id, reportId: '507f1f77bcf86cd799439012' }, user: { role, _id: id } }, res);
  return res;
}
test('admin reports and receptionist receipts use the shared PDF renderers', async () => {
  assert.equal((await call(downloadAdminReport)).code, 200);
  assert.equal(rendered.kind, 'report');
  assert.equal(rendered.report, report);
  const receiptResponse = await call(downloadReceptionistReceipt, 'receptionist');
  assert.equal(receiptResponse.code, 200);
  assert.equal(typeof receiptResponse.listeners.finish, 'function');
  assert.equal(rendered.kind, 'receipt');
  assert.equal(rendered.booking, booking);
});
test('legacy download routes keep approval and payment restrictions', async () => {
  report.status = 'Pending Approval';
  assert.equal((await call(downloadAdminReport)).code, 404);
  booking.paymentStatus = 'Unpaid';
  assert.equal((await call(downloadReceptionistReceipt, 'receptionist')).code, 400);
  assert.equal(rendered, null);
});
test('shared preview serves approved report to its patient and submitted reports to assigned staff', async () => {
  assert.equal((await call(getReportPdf, 'patient')).headers['Content-Type'], 'application/pdf');
  report.status = 'Pending Approval';
  for (const role of ['technician', 'pathologist', 'admin', 'receptionist']) {
    const res = await call(getReportPdf, role);
    assert.equal(res.code, 200);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
  }
});
test('shared preview blocks unapproved patient access and unrelated staff', async () => {
  report.status = 'Pending Approval';
  assert.equal((await call(getReportPdf, 'patient')).code, 403);
  assert.equal((await call(getReportPdf, 'technician', 'another')).code, 403);
  assert.equal((await call(getReportPdf, 'pathologist', 'another')).code, 403);
  assert.equal(rendered, null);
});
