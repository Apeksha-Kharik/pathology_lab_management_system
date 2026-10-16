const { test } = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const notifications = require('../services/patientNotifications');
const { notifyGeneratedReceipt } = require('../services/receiptNotificationService');
const booking = { _id: 'booking', paymentStatus: 'Paid' };

test('receipt message sends once across repeated and concurrent PDF downloads', async t => {
  let claimed = false;
  let sent = 0;
  t.mock.method(Booking, 'findOneAndUpdate', async query => {
    assert.equal(query.receiptReadyNotifiedAt, null);
    if (claimed) return null;
    claimed = true;
    return booking;
  });
  t.mock.method(notifications, 'notifyReceiptReady', async () => { sent++; return { sent: true }; });
  t.mock.method(Booking, 'updateOne', async (query, update) => {
    assert.ok(update.$set.receiptReadyNotifiedAt instanceof Date);
    assert.equal(update.$unset.receiptReadyNotificationLockUntil, 1);
  });
  await Promise.all([notifyGeneratedReceipt(booking), notifyGeneratedReceipt(booking)]);
  await notifyGeneratedReceipt(booking);
  assert.equal(sent, 1);
});

test('failed receipt send releases the lock and unpaid receipts send nothing', async t => {
  let claims = 0;
  t.mock.method(Booking, 'findOneAndUpdate', async () => { claims++; return booking; });
  t.mock.method(notifications, 'notifyReceiptReady', async () => ({ sent: false }));
  t.mock.method(Booking, 'updateOne', async (query, update) => {
    assert.equal(update.$set, undefined);
    assert.equal(update.$unset.receiptReadyNotificationLockUntil, 1);
  });
  await notifyGeneratedReceipt({ ...booking, paymentStatus: 'Unpaid' });
  assert.equal(claims, 0);
  await notifyGeneratedReceipt(booking);
  assert.equal(claims, 1);
});
