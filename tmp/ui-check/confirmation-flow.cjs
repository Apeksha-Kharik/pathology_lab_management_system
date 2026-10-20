const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const Booking = require('../../backend/models/Booking');
const User = require('../../backend/models/User');
User.countDocuments = async () => 2;
Booking.countDocuments = async () => 0;
const { updateBookingStatus } = require('../../backend/controllers/receptionistController');
let booking = { _id: '507f1f77bcf86cd799439011', bookingCode: 'BK-FLOW', name: 'Flow Test', bookingDate: '2026-10-22', date: '2026-10-22', timeSlot: '10:00 AM', testName: 'CBC', amount: 500, paymentPreference: 'online', paymentStatus: 'Unpaid', status: 'Pending Approval', bookingStatus: 'Pending Approval' };
Booking.findById = () => ({ populate: () => ({ lean: async () => ({ ...booking }) }) });
Booking.updateOne = async (query, update) => { assert.equal(query.bookingStatus, booking.bookingStatus); Object.assign(booking, update.$set); return { modifiedCount: 1 }; };
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
  const pages = {};
  for (const role of ['patient', 'receptionist', 'technician']) {
   const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
   await context.addInitScript(role => { localStorage.setItem('token', 'test-only'); localStorage.setItem('user', JSON.stringify({ id: 'test-user', name: 'Example User', role })); }, role);
   const page = await context.newPage(); pages[role] = page;
   page.on('dialog', dialog => dialog.accept());
   page.on('pageerror', error => { throw error; });
   await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.hostname === '127.0.0.1') return route.continue();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(body) });
    if (request.method() === 'OPTIONS') return json({});
    if (request.method() === 'PATCH' && url.pathname.endsWith('/status')) {
      const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
      await updateBookingStatus({ params: { id: booking._id }, body: request.postDataJSON() }, res);
      return json(res.body, res.code);
    }
    if (url.pathname.endsWith('/bookings')) return json([{ ...booking }]);
    return json([]);
   });
   await page.goto('http://127.0.0.1:5197' + ({ patient: '/patient_dashboard', receptionist: '/receptionist', technician: '/technician/dashboard' })[role]);
  }
  const patient = pages.patient;
  await patient.getByRole('main').getByRole('button', { name: 'Booking History', exact: true }).click();
  await patient.getByText('Pay Now appears after receptionist confirmation.').waitFor();
  assert.equal(await patient.getByRole('button', { name: 'Pay Now', exact: true }).count(), 0);
  await pages.receptionist.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await pages.receptionist.getByRole('status').filter({ hasText: 'confirmed successfully' }).waitFor();
  assert.equal(booking.bookingStatus, 'Confirmed'); assert.equal(booking.status, 'Confirmed');
  await patient.evaluate(() => window.dispatchEvent(new Event('focus')));
  await patient.getByRole('button', { name: 'Pay Now', exact: true }).waitFor();
  await patient.getByText('Confirmed', { exact: true }).waitFor();
  const style = page => page.getByRole('tab').first().evaluate(el => { const s = getComputedStyle(el); return { color: s.color, font: s.fontFamily, weight: getComputedStyle(el.querySelector('span.block.text-sm')).fontWeight, radius: s.borderRadius }; });
  // Select the first tab in each dashboard to compare the same active treatment.
  await pages.receptionist.getByRole('tab').first().click();
  await pages.receptionist.waitForFunction(() => getComputedStyle(document.querySelector('[role=tab]')).color === 'rgb(255, 255, 255)');
  assert.deepEqual(await style(pages.receptionist), await style(pages.technician));
  await patient.screenshot({ path: 'tmp/ui-previews/patient-confirmed-pay-now.png', fullPage: true });
  console.log('PASS: actual confirmation controller -> saved status -> patient refresh -> visible Pay Now; receptionist and technician nav computed styles match. API/database are test doubles; no real booking/payment was made.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

