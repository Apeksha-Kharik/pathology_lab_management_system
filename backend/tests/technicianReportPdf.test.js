const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Report = require('../models/Report');
let rendered;
const pdfPath = require.resolve('../services/patientPdfService');
require.cache[pdfPath] = { id: pdfPath, filename: pdfPath, loaded: true, exports: {
  renderReportPdf: report => { rendered = report; }, buildPatientPdfFilename: () => 'report.pdf'
} };
const { downloadTechnicianReport } = require('../controllers/documentController');
let report;
beforeEach(t => {
  rendered = null;
  report = { technicianId: 'owner', status: 'Pending Approval', bookingId: { name: 'Example' }, results: [{ parameter: 'A', value: '1' }] };
  const query = { populate() { return this; }, then(resolve) { return Promise.resolve(report).then(resolve); } };
  t.mock.method(Report, 'findById', () => query);
});
async function call(id = '507f1f77bcf86cd799439011', user = 'owner') {
  const res = { code: 200, headers: {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, setHeader(key, value) { this.headers[key] = value; } };
  await downloadTechnicianReport({ params: { reportId: id }, user: { _id: user } }, res);
  return res;
}
test('owner can download pending and approved PDFs from persisted results', async () => {
  for (const status of ['Pending Approval', 'Pending Review', 'Approved', 'Rejected']) {
    report.status = status;
    const res = await call();
    assert.equal(res.code, 200);
    assert.equal(res.headers['Content-Type'], 'application/pdf');
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    assert.equal(rendered, report);
  }
});
test('another technician cannot download a report', async () => {
  assert.equal((await call(undefined, 'other')).code, 403);
  assert.equal(rendered, null);
});
test('drafts, invalid IDs, and missing reports do not render PDFs', async () => {
  report.status = 'Draft';
  assert.equal((await call()).code, 409);
  assert.equal((await call('invalid')).code, 400);
  report = null;
  assert.equal((await call()).code, 404);
  assert.equal(rendered, null);
});
