const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Assignment = require('../models/TechnicianAssignment');
const { assignTechnician } = require('../controllers/receptionistController');
const { acceptAssignmentRequest } = require('../controllers/technicianController');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const busy = '507f1f77bcf86cd799439012';
const free = '507f1f77bcf86cd799439013';
const bookingId = '507f1f77bcf86cd799439011';

test('paid booking requests least loaded technician without assigning before acceptance', async t => {
 const booking = { _id: bookingId, bookingStatus: 'Confirmed', paymentStatus: 'Paid', bookingDate: '2026-10-22', timeSlot: '10:00 AM' };
 t.mock.method(Booking, 'findById', async () => booking);
 t.mock.method(Booking, 'find', () => ({ select: async () => [] }));
 t.mock.method(Booking, 'aggregate', async () => [{ _id: busy, count: 4 }]);
 t.mock.method(User, 'find', () => ({ select: () => ({ sort: async () => [{ _id: busy, name: 'Busy' }, { _id: free, name: 'Free' }] }) }));
 t.mock.method(Assignment, 'exists', async () => false);
 t.mock.method(Assignment, 'findOne', async () => null);
 t.mock.method(Assignment, 'distinct', async () => []);
 t.mock.method(Assignment, 'aggregate', async () => [{ _id: free, count: 1 }]);
 t.mock.method(Assignment, 'find', () => ({ select: () => ({ sort: async () => [] }) }));
 t.mock.method(Booking, 'findOneAndUpdate', async () => assert.fail('request must not assign booking'));
 t.mock.method(Assignment, 'create', async data => {
  assert.equal(data.technician, free);
  assert.equal(data.status, 'PENDING');
  return { ...data, populate: async () => {} };
 });
 const res = response();
 await assignTechnician({ params: { id: bookingId }, user: { _id: 'receptionist' } }, res);
 assert.equal(res.code, 201);
 assert.equal(booking.assignedTechnician, undefined);
 assert.equal(booking.bookingStatus, 'Confirmed');
});

test('unpaid booking cannot send a technician request', async t => {
 t.mock.method(Booking, 'findById', async () => ({ paymentStatus: 'Unpaid', bookingStatus: 'Confirmed' }));
 t.mock.method(Assignment, 'create', async () => assert.fail('unpaid request'));
 const res = response();
 await assignTechnician({ params: { id: bookingId } }, res);
 assert.equal(res.code, 400);
});

test('technician acceptance assigns booking within the acceptance transaction', async t => {
 const session = { withTransaction: async fn => fn(), endSession: async () => {} };
 t.mock.method(mongoose, 'startSession', async () => session);
 t.mock.method(Assignment, 'findOneAndUpdate', async (query, update, options) => {
  assert.equal(query.technician, free);
  assert.equal(query.status, 'PENDING');
  assert.equal(update.$set.status, 'ACCEPTED');
  assert.equal(options.session, session);
  return { booking: bookingId, populate: async () => {} };
 });
 t.mock.method(Booking, 'findOneAndUpdate', async (query, update, options) => {
  assert.equal(query.assignedTechnician, null);
  assert.equal(update.$set.assignedTechnician, free);
  assert.equal(update.$set.bookingStatus, 'Technician Assigned');
  assert.equal(options.session, session);
  return { _id: bookingId, ...update.$set };
 });
 const res = response();
 await acceptAssignmentRequest({ params: { assignmentId: '507f1f77bcf86cd799439014' }, user: { _id: free } }, res);
 assert.equal(res.code, 200);
 assert.equal(res.body.booking.assignedTechnician, free);
});
