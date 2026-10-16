const test = require('node:test');
const assert = require('node:assert/strict');
const { generateReportPdf } = require('../services/patientPdfService');
const rows = [
  { parameter: 'Complete Blood Count - Hemoglobin', value: '13.2', unit: 'g/dL', referenceRange: '12-15' },
  { parameter: 'Complete Blood Count - Total White Blood Cell Count', value: '7200', unit: 'cells/uL', referenceRange: '4000-11000' },
  { parameter: 'Thyroid Function Test - Thyroid Stimulating Hormone (TSH)', value: '2.4', unit: 'uIU/mL', referenceRange: '0.4-4.0' },
  { parameter: 'Lipid Profile - Total Cholesterol', value: '172', unit: 'mg/dL', referenceRange: '<200' }
];
const report = {
  status: 'Approved', reportId: 'DEMO', bookingId: { name: 'Demo Patient', age: 35, gender: 'Female', phone: '9000000000', patientCode: 'PID-DEMO', bookingCode: 'BK-DEMO', sampleId: 'SMP-DEMO' },
  testName: 'Full Body Checkup - Complete Blood Count, Thyroid, Liver, Kidney and Lipid Profile',
  approvedAt: '2026-10-16T06:30:00Z', approvedPathologistName: 'Dr. Demo Pathologist', approvedPathologistQualification: 'MD (Pathology)', approvedPathologistRegistrationNumber: 'DEMO-1234',
  technicianRemarks: 'Sample received in satisfactory condition.', pathologistRemarks: 'Please correlate the findings with clinical history.', results: rows
};
const countPages = buffer => (buffer.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
test('short report with remarks fits one page, including a signature image allocation', async () => {
  const signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXs8AAAAASUVORK5CYII=';
  const pdf = await generateReportPdf({ ...report, pathologistSignatureImage: signature });
  assert.equal(countPages(pdf.buffer), 1);
});
test('long reports add pages according to content', async () => {
  const pdf = await generateReportPdf({ ...report, results: Array.from({ length: 60 }, (_, i) => rows[i % rows.length]) });
  assert.ok(countPages(pdf.buffer) > 1);
});
