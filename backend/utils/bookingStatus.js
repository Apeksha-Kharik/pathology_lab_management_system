const normalizeBookingStatus = booking => {
  const status = booking.bookingStatus || booking.status || 'Pending Approval';
  return status === 'Pending' ? 'Pending Approval' : status;
};

module.exports = { normalizeBookingStatus };
