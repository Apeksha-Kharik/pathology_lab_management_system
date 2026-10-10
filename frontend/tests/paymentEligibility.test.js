import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPayOnline } from '../src/utils/paymentEligibility.js';

test('Pay Now is restricted to confirmed/arrived unpaid server online bookings', () => {
  const eligible = { _id: 'booking-id', paymentPreference: 'online', bookingStatus: 'Confirmed', paymentStatus: 'Unpaid' };
  assert.equal(canPayOnline(eligible), true);
  assert.equal(canPayOnline({ ...eligible, bookingStatus: 'Arrived' }), true);
  assert.equal(canPayOnline({ ...eligible, paymentStatus: 'Failed' }), true);
  for (const bookingStatus of ['Pending Approval', 'Rejected', 'Cancelled', 'Completed']) {
    assert.equal(canPayOnline({ ...eligible, bookingStatus }), false);
  }
  for (const paymentStatus of ['Paid', 'Refunded']) {
    assert.equal(canPayOnline({ ...eligible, paymentStatus }), false);
  }
  assert.equal(canPayOnline({ ...eligible, paymentPreference: 'cash' }), false);
  assert.equal(canPayOnline({ ...eligible, paymentPreference: undefined }), false);
  assert.equal(canPayOnline({ ...eligible, _id: undefined, id: 'local-only-booking' }), false);
});

test('mapped history rows preserve payment eligibility', () => {
  assert.equal(canPayOnline({ serverBookingId: 'booking-id', id: 'booking-id', paymentPreference: 'online', status: 'Confirmed', paymentStatus: 'Unpaid' }), true);
});
