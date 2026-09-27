const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const https = require('https');
const Notification = require('../models/WhatsAppNotification');
const { sendWhatsAppDocument } = require('../services/whatsappService');
const { generateReceiptPdf, generateReportPdf } = require('../services/patientPdfService');

test('document upload, media message, template header, and failed upload', async t => {
  const old = { ...process.env };
  t.after(() => { for (const k of Object.keys(process.env)) if (!(k in old)) delete process.env[k]; Object.assign(process.env, old); });
  process.env.WHATSAPP_ACCESS_TOKEN = 'fake';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
  delete process.env.WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT;
  const logs = [], payloads = [];
  t.mock.method(Notification, 'create', async entry => logs.push(entry));
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.match(url, /\/123\/media$/);
    assert.equal(options.body.get('file').type, 'application/pdf');
    return { ok: true, json: async () => ({ id: 'media-123' }) };
  });
  t.mock.method(https, 'request', (options, callback) => {
    const req = new EventEmitter();
    req.write = data => payloads.push(JSON.parse(data));
    req.end = () => { const res = new EventEmitter(); res.statusCode = 200; callback(res); res.emit('data', JSON.stringify({ messages: [{ id: 'message-1' }] })); res.emit('end'); };
    return req;
  });
  const input = { to: '9876543210', event: 'payment_received', buffer: Buffer.from('%PDF-test'), filename: 'receipt.pdf', caption: 'Receipt', parameters: ['Patient', 'BK1', 'INR 120'] };
  assert.equal((await sendWhatsAppDocument(input)).sent, true);
  assert.equal(payloads[0].document.id, 'media-123');
  assert.equal(payloads[0].type, 'document');
  process.env.WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT = 'receipt_pdf';
  await sendWhatsAppDocument(input);
  assert.equal(payloads[1].template.components[0].parameters[0].document.id, 'media-123');
  assert.equal(payloads[1].template.components[1].parameters.length, 3);
  t.mock.method(global, 'fetch', async () => ({ ok: false, json: async () => ({ error: { message: 'Upload denied' } }) }));
  assert.equal((await sendWhatsAppDocument(input)).sent, false);
  assert.equal(payloads.length, 2);
  assert.equal(logs.at(-1).status, 'FAILED');
});

test('PDFs require payment/approval and render receipt and signed report data', async () => {
  await assert.rejects(generateReceiptPdf({ paymentStatus: 'Unpaid' }));
  await assert.rejects(generateReportPdf({ status: 'Pending Approval' }));
  const booking = { name: 'Demo Patient', patientCode: 'PID1', bookingCode: 'BK1', paymentStatus: 'Paid', amount: 120, testName: 'Blood Sugar', receiptId: 'RCT1', paidAt: new Date(), age: 30, gender: 'Female' };
  const receipt = await generateReceiptPdf(booking);
  const report = await generateReportPdf({ status: 'Approved', bookingId: booking, testName: 'Blood Sugar', approvedAt: new Date(), approvedPathologistName: 'Demo Pathologist', approvedPathologistQualification: 'MD', results: [{ parameter: 'Glucose', value: '90', unit: 'mg/dL', normalRange: '70-100' }] });
  for (const pdf of [receipt, report]) { assert.equal(pdf.buffer.subarray(0, 4).toString(), '%PDF'); assert.ok(pdf.buffer.length > 1000); }
  if (process.env.PDF_QA_OUTPUT) {
    const fs = require('fs'); fs.mkdirSync(process.env.PDF_QA_OUTPUT, { recursive: true });
    fs.writeFileSync(require('path').join(process.env.PDF_QA_OUTPUT, 'receipt.pdf'), receipt.buffer);
    fs.writeFileSync(require('path').join(process.env.PDF_QA_OUTPUT, 'report.pdf'), report.buffer);
  }
});
