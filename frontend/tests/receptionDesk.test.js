import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingStatus, currentAssignment, bookingActions, assignmentScope, receptionToday, canAssign, isPaymentDue, primaryAction, searchBookings } from '../src/utils/receptionDesk.js';

test('today uses Indian time at the UTC date boundary', () => {
  assert.equal(receptionToday(new Date('2026-10-15T20:00:00Z')), '2026-10-16');
});

test('original desk actions stay available together across separated sections', () => {
  const booking = { bookingStatus: 'Confirmed', paymentStatus: 'Unpaid' };
  assert.deepEqual(bookingActions(booking).map(action => action.type), ['arrival', 'payment']);
  const ready = { bookingStatus: 'Arrived', paymentStatus: 'Paid' };
  assert.deepEqual(bookingActions(ready).map(action => action.label), ['Auto Send Request', 'Generate Receipt']);
  assert.equal(bookingActions(ready, [{ status: 'REJECTED' }])[0].label, 'Auto Reassign Fairly');
  assert.equal(bookingActions(ready, [{ status: 'PENDING' }]).some(action => action.type === 'assign'), false);
});

test('technician rejection remains visible and allows another request until accepted', () => {
  const booking = { bookingStatus: 'Arrived', paymentStatus: 'Paid' };
  const rejected = { status: 'REJECTED', requestedAt: '2026-10-17T08:00:00Z', rejectionReason: 'Unavailable' };
  const older = { status: 'REJECTED', requestedAt: '2026-10-16T08:00:00Z' };
  assert.equal(currentAssignment([older, rejected]), rejected);
  assert.equal(bookingActions(booking, [rejected])[0].label, 'Auto Reassign Fairly');
  const pending = { status: 'PENDING', requestedAt: '2026-10-17T09:00:00Z' };
  assert.equal(currentAssignment([rejected, pending]), pending);
  assert.equal(canAssign(booking, [rejected, pending]), false);
  const accepted = { ...pending, status: 'ACCEPTED' };
  assert.equal(currentAssignment([rejected, accepted]), accepted);
  assert.equal(canAssign(booking, [rejected, accepted]), false);
});
test('assignment requires payment and no active technician request; arrival is independent', () => {
  const booking = { bookingStatus: 'Arrived', paymentStatus: 'Paid' };
  assert.equal(canAssign(booking), true);
  assert.equal(canAssign({ ...booking, bookingStatus: 'Confirmed', patientArrived: false }), true);
  assert.equal(bookingActions({ ...booking, bookingStatus: 'Confirmed', patientArrived: false }, [], 'assignments')[0].label, 'Auto Send Request');
  assert.equal(canAssign({ ...booking, bookingStatus: 'Pending Approval' }), false);
  for (const status of ['PENDING', 'ACCEPTED']) assert.equal(canAssign(booking, [{ status }]), false);
  assert.equal(canAssign({ ...booking, paymentStatus: 'Unpaid' }), false);
  assert.equal(canAssign({ ...booking, bookingStatus: 'Report Ready', patientArrived: true }), false);
});
test('primary actions follow booking progress and protect online payments', () => {
  assert.equal(primaryAction({ bookingStatus: 'Pending Approval' }).type, 'confirm');
  assert.equal(primaryAction({ bookingStatus: 'Confirmed', paymentStatus: 'Unpaid' }).type, 'arrival');
  const online = { bookingStatus: 'Arrived', paymentStatus: 'Unpaid', paymentPreference: 'online' };
  assert.equal(primaryAction(online, [], 'payments').type, 'waiting');
  assert.equal(primaryAction({ ...online, paymentPreference: 'cash' }, [], 'payments').type, 'payment');
  assert.equal(primaryAction({ ...online, paymentStatus: 'Paid' }).type, 'assign');
});
test('search includes IDs, phone and tests without changing source data', () => {
  const bookings = [{ name: 'Example', bookingCode: 'BK100', patientCode: 'PID100', phone: '9000000000', testName: 'CBC' }];
  for (const query of ['bk100', 'PID100', '9000', 'cbc', 'example']) assert.equal(searchBookings(bookings, query).length, 1);
  assert.equal(searchBookings(bookings, 'missing').length, 0);
  assert.equal(bookings.length, 1);
  assert.equal(isPaymentDue({ bookingStatus: 'Confirmed', paymentStatus: 'Unpaid' }), true);
  assert.equal(isPaymentDue({ bookingStatus: 'Rejected', paymentStatus: 'Unpaid' }), false);
});

test('assignment views separate ready, pending and assigned work safely', () => {
  const ready = { bookingStatus: 'Arrived', paymentStatus: 'Paid' };
  assert.equal(assignmentScope(ready), 'ready');
  assert.equal(primaryAction(ready, [], 'assignments').label, 'Auto Send Request');
  assert.equal(assignmentScope(ready, [{ status: 'PENDING' }]), 'pending');
  assert.equal(assignmentScope({ ...ready, assignedTechnician: 'technician-id' }), 'assigned');
  const processing = { ...ready, bookingStatus: 'Processing', patientArrived: true };
  assert.equal(canAssign(processing), false);
  assert.equal(primaryAction(processing, [], 'assignments').type, 'details');
  assert.equal(assignmentScope(processing), 'other');
  assert.equal(assignmentScope(ready, [{ status: 'REJECTED' }]), 'ready');
});

test('legacy Pending uses the same status and actions as new requests', () => {
  assert.equal(bookingStatus({ status: 'Pending' }), 'Pending Approval');
  assert.equal(bookingActions({ status: 'Pending' })[0].type, 'confirm');
});

test('arrival and technician requests remain in separate sections before and after arrival', () => {
  const booking = { bookingStatus: 'Confirmed', paymentStatus: 'Paid' };
  assert.equal(bookingActions(booking, [], 'appointments').some(action => action.type === 'arrival'), true);
  assert.equal(bookingActions(booking, [], 'assignments').some(action => action.type === 'arrival'), false);
  const arrived = { ...booking, bookingStatus: 'Arrived', patientArrived: true };
  for (const view of ['appointments', 'payments', 'history']) {
    assert.equal(bookingActions(arrived, [], view).some(action => action.type === 'assign'), false);
  }
  assert.equal(bookingActions(arrived, [], 'assignments').some(action => action.type === 'assign'), true);
  assert.equal(bookingActions(arrived, [{ status: 'REJECTED' }], 'assignments')[0].label, 'Auto Reassign Fairly');
  assert.equal(bookingActions(arrived, [{ status: 'PENDING' }], 'assignments').some(action => action.type === 'assign'), false);
});
