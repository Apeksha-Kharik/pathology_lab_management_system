const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const base = { bookingDate: today, timeSlot: '10:00 AM', amount: 500, phone: '9000000000', patientCode: 'PID-DEMO', age: 35, gender: 'Female', collectionType: 'Visit Lab', address: 'Demo address', notes: 'Demo note', paymentPreference: 'cash' };
let bookings = [
  { ...base, _id: 'request', bookingCode: 'BK001', name: 'Asha Example', testName: 'Complete Blood Count', bookingStatus: 'Pending Approval', paymentStatus: 'Unpaid' },
  { ...base, _id: 'offline', bookingCode: 'BK002', name: 'Bharat Example', testName: 'Lipid Profile', bookingStatus: 'Arrived', paymentStatus: 'Unpaid', patientArrived: true },
  { ...base, _id: 'online', bookingCode: 'BK003', name: 'Charu Example', testName: 'Thyroid Function Test', bookingStatus: 'Confirmed', paymentStatus: 'Unpaid', paymentPreference: 'online' },
  { ...base, _id: 'ready', bookingCode: 'BK004', name: 'Deepak Example', testName: 'Blood Sugar', bookingStatus: 'Confirmed', paymentStatus: 'Paid', patientArrived: false },
  { ...base, _id: 'waiting', bookingCode: 'BK005', name: 'Esha Example', testName: 'Urine Routine', bookingStatus: 'Arrived', paymentStatus: 'Paid', patientArrived: true },
  { ...base, _id: 'past', bookingCode: 'BK006', name: 'Farah Example', testName: 'Hemoglobin', bookingDate: '2026-01-01', bookingStatus: 'Completed', paymentStatus: 'Paid' }
];
let assignments = [{ _id: 'assignment-1', booking: { _id: 'waiting' }, technician: { name: 'Demo Technician' }, status: 'PENDING', requestedAt: new Date().toISOString() }];
const writes = [];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => { localStorage.setItem('token', 'ui-test-only'); localStorage.setItem('user', JSON.stringify({ id: 'demo-receptionist', role: 'receptionist', name: 'Demo Receptionist' })); });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.type() === 'prompt' ? dialog.dismiss() : dialog.accept());
    await page.route('**/api/**', async route => {
      const request = route.request();
      const endpoint = new URL(request.url()).pathname;
      const json = data => route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      if (request.method() === 'GET' && endpoint.endsWith('/bookings')) return json(bookings);
      if (request.method() === 'GET' && endpoint.endsWith('/tests')) return json([{ _id: 'cbc', testName: 'CBC', price: 500 }]);
      if (request.method() === 'GET' && endpoint.endsWith('/technician-assignments')) return json(assignments);
      if (request.method() === 'PATCH' && endpoint.includes('/bookings/request/status')) {
        writes.push(endpoint);
        const next = { ...bookings[0], bookingStatus: request.postDataJSON().status };
        bookings[0] = next;
        return json({ message: 'Booking confirmed.', booking: next });
      }
      if (request.method() === 'PATCH' && endpoint.endsWith('/bookings/ready/technician')) {
        writes.push(endpoint);
        const assignment = { _id: 'new-assignment', booking: { _id: 'ready' }, technician: { name: 'Demo Technician' }, status: 'PENDING' };
        assignments = [assignment, ...assignments];
        return json({ message: 'Assignment request sent.', assignment });
      }
      if (request.method() === 'PATCH' && endpoint.endsWith('/bookings/offline/payment')) {
        writes.push(endpoint);
        bookings = bookings.map(booking => booking._id === 'offline' ? { ...booking, paymentStatus: 'Paid' } : booking);
        return json({ message: 'Payment recorded.', booking: bookings.find(booking => booking._id === 'offline') });
      }
      if (request.method() === 'POST' && endpoint.endsWith('/walk-in-bookings')) {
        writes.push(endpoint);
        const booking = { ...base, ...request.postDataJSON(), _id: 'walk-in', bookingCode: 'BK007', testName: 'CBC', bookingStatus: 'Confirmed', paymentStatus: 'Unpaid' };
        bookings.push(booking);
        return json({ message: 'Walk-in created.', booking });
      }
      throw new Error(`Unexpected API call: ${request.method()} ${endpoint}`);
    });
    await page.goto('http://127.0.0.1:5197/receptionist');
    await page.getByRole('button', { name: 'Confirm booking', exact: true }).waitFor();
    assert.equal(await page.getByRole('tab').count(), 5);
    fs.mkdirSync(path.join(root, 'tmp/ui-previews'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'tmp/ui-previews/reception-requests.png'), fullPage: true });
    await page.getByRole('button', { name: 'Asha Example', exact: true }).click();
    await page.getByRole('button', { name: 'Reject booking', exact: true }).click();
    assert.equal(writes.length, 0);
    await page.getByRole('button', { name: 'Close booking details', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Booking confirmed.' }).waitFor();
    assert.equal(writes.length, 1);
    await page.getByRole('tab', { name: /Appointments/ }).click();
    assert.equal(await page.getByRole('button', { name: 'Auto Send Request', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Asha Example', exact: true }).click();
    await page.getByRole('dialog', { name: 'Asha Example' }).waitFor();
    assert.ok(await page.getByText('Demo address', { exact: true }).isVisible());
    await page.screenshot({ path: path.join(root, 'tmp/ui-previews/reception-details.png'), fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.getByRole('tab', { name: /Payments/ }).click();
    const onlineRow = page.getByRole('row').filter({ hasText: 'Charu Example' });
    assert.equal(await onlineRow.getByRole('button', { name: 'Mark as Paid' }).count(), 0);
    assert.ok(await onlineRow.getByText('Awaiting online payment').isVisible());
    await page.getByRole('row').filter({ hasText: 'Bharat Example' }).getByRole('button', { name: 'Mark as Paid' }).click();
    await page.getByRole('button', { name: 'Save Payment', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Save Payment', exact: true }).click();
    await page.getByText('Payment recorded. Receipt is available in booking details.', { exact: true }).waitFor();
    assert.equal(writes.length, 2);
    await page.getByRole('tab', { name: /Technician assignments/ }).click();
    assert.equal(await page.getByRole('button', { name: 'Patient Arrived', exact: true }).count(), 0);
    assert.ok(await page.getByText('Awaiting technician', { exact: true }).isVisible());
    await page.screenshot({ path: path.join(root, 'tmp/ui-previews/reception-assignments.png'), fullPage: true });
    await page.getByRole('row').filter({ hasText: 'Deepak Example' }).getByRole('button', { name: 'Auto Send Request' }).click();
    await page.getByText('Assignment request sent.', { exact: true }).waitFor();
    assert.equal(writes.length, 3);
    assignments = assignments.map(item => item._id === 'assignment-1' ? { ...item, status: 'REJECTED', rejectionReason: 'Unavailable for this appointment', respondedAt: new Date().toISOString() } : item);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const rejectedRow = page.getByRole('row').filter({ hasText: 'Esha Example' });
    await rejectedRow.getByText('Rejected', { exact: true }).waitFor();
    assert.ok(await rejectedRow.getByText(/Unavailable for this appointment/).isVisible());
    assert.ok(await rejectedRow.getByRole('button', { name: 'Auto Reassign Fairly' }).isVisible());
    assignments = assignments.map(item => item.booking?._id === 'ready' ? { ...item, status: 'ACCEPTED' } : item);
    bookings = bookings.map(item => item._id === 'ready' ? { ...item, assignedTechnician: { name: 'Demo Technician' }, bookingStatus: 'Technician Assigned' } : item);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const acceptedRow = page.getByRole('row').filter({ hasText: 'Deepak Example' });
    await acceptedRow.getByText('Accepted', { exact: true }).waitFor();
    assert.equal(await acceptedRow.getByRole('button', { name: /Auto/ }).count(), 0);
    await page.getByRole('tab', { name: /Patient history/ }).click();
    await page.getByRole('textbox', { name: 'Search bookings' }).fill('Farah');
    assert.equal(await page.getByRole('row').count(), 2);
    await page.getByRole('button', { name: 'Clear search' }).click();
    await page.getByRole('button', { name: 'Add walk-in patient', exact: true }).click();
    await page.getByRole('textbox', { name: 'Patient name', exact: true }).fill('Gita Example');
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('9000000000');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('gita@example.test');
    await page.getByRole('spinbutton', { name: 'Age', exact: true }).fill('35');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Create Confirmed Booking', exact: true }) });
    await form.getByRole('combobox').nth(0).selectOption('Female');
    await form.getByRole('combobox').nth(1).selectOption('cbc');
    await page.getByRole('button', { name: 'Create Confirmed Booking', exact: true }).click();
    await page.getByRole('button', { name: 'Gita Example', exact: true }).waitFor();
    assert.equal(writes.length, 4);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: /Booking requests/ }).click();
    await page.screenshot({ path: path.join(root, 'tmp/ui-previews/reception-mobile.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: tabs, confirmation, rejection cancellation, details/Escape, payment guard and save, assignment request, walk-in creation, history search, mobile layout, and no page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
