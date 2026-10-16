const fs = require('fs');
const path = require('path');
const { generateReportPdf, generateReceiptPdf } = require('../services/patientPdfService');
async function main() {
  const booking = { name: 'Demo Patient', age: 35, gender: 'Female', phone: '9000000000', patientCode: 'PID-DEMO-001', bookingCode: 'BK-DEMO-001', sampleId: 'SMP-DEMO-001', testName: 'Full Body Checkup - Complete Blood Count, Thyroid, Liver, Kidney and Lipid Profile', amount: 2399, paymentStatus: 'Paid', paymentMethod: 'cash', receiptNumber: 'RCT-DEMO-001', bookingDate: '2026-10-16', timeSlot: '09:00 AM - 10:00 AM', paidAt: '2026-10-16T04:30:00Z' };
  const results = [
    { parameter: 'Complete Blood Count - Hemoglobin', value: '13.2', unit: 'g/dL', referenceRange: 'Male: 13-17 / Female: 12-15' },
    { parameter: 'Complete Blood Count - Total White Blood Cell Count', value: '7200', unit: 'cells/\u00b5L', referenceRange: '4000-11000' },
    { parameter: 'Thyroid Function Test - Thyroid Stimulating Hormone (TSH)', value: '2.4', unit: '\u00b5IU/mL', referenceRange: '0.4-4.0' },
    { parameter: 'Lipid Profile - Total Cholesterol', value: '172', unit: 'mg/dL', referenceRange: '<200' }
  ];
  const report = { status: 'Approved', reportId: 'RPT-DEMO-001', testName: booking.testName, bookingId: booking, results, approvedAt: '2026-10-16T06:30:00Z', approvedPathologistName: 'Dr. Demo Pathologist', approvedPathologistQualification: 'MD (Pathology)', approvedPathologistRegistrationNumber: 'DEMO-1234', technicianRemarks: 'Sample received in satisfactory condition.', pathologistRemarks: 'Please correlate the findings with clinical history.' };
  const directory = path.join(__dirname, '../../output/pdf');
  fs.mkdirSync(directory, { recursive: true });
  for (const [name, pdf] of [
    ['receipt-preview', await generateReceiptPdf(booking)],
    ['report-preview', await generateReportPdf(report)],
    ...(fs.existsSync(path.join(__dirname, '../../tmp/pdfs/demo-signature.png')) ? [
      ['report-signature-preview', await generateReportPdf({ ...report, pathologistSignatureImage: 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '../../tmp/pdfs/demo-signature.png')).toString('base64') })]
    ] : []),
    ['report-pagination-check', await generateReportPdf({ ...report, results: Array.from({ length: 20 }, (_, i) => results[i % 4]) })],
    ['report-review-preview', await new Promise((resolve, reject) => {
      const { Writable } = require('stream');
      const { renderReportPdf } = require('../services/patientPdfService');
      const chunks = [];
      const output = new Writable({ write(chunk, encoding, done) { chunks.push(chunk); done(); } });
      output.on('error', reject);
      output.on('finish', () => resolve({ buffer: Buffer.concat(chunks) }));
      renderReportPdf({ ...report, status: 'Pending Approval', reportId: 'DEMO-REVIEW-ONLY', submittedAt: '2026-10-16T06:30:00Z', results: [
        { parameter: 'Complete Blood Count - Hemoglobin', value: '11', unit: 'g/dL', referenceRange: 'Male: 13-17 / Female: 12-15' },
        { parameter: 'Complete Blood Count - RBC Count', value: '3.3', unit: 'million/\u00b5L', referenceRange: 'Male: 4.5-5.9 / Female: 4.1-5.1' },
        { parameter: 'Complete Blood Count - WBC Count', value: '5000', unit: 'cells/\u00b5L', referenceRange: '4000-11000' },
        { parameter: 'Complete Blood Count - Platelet Count', value: '250000', unit: '/\u00b5L', referenceRange: '150000-450000' },
        { parameter: 'Complete Blood Count - Hematocrit (PCV)', value: '45', unit: '%' },
        { parameter: 'Complete Blood Count - MCV', value: '324', unit: 'fL' },
        { parameter: 'Complete Blood Count - MCH', value: '241', unit: 'pg' }
      ] }, {}, output);
    })]
  ]) fs.writeFileSync(path.join(directory, `${name}.pdf`), pdf.buffer);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
