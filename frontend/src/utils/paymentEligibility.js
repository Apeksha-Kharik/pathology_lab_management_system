export const canPayOnline = (booking) => Boolean(booking._id || booking.serverBookingId)
  && booking.paymentPreference === 'online'
  && ['Confirmed', 'Arrived'].includes(booking.bookingStatus || booking.status)
  && ['Unpaid', 'Failed'].includes(booking.paymentStatus);

export const paymentPreferenceLabel = (preference) => preference === 'online' ? 'Online payment' : 'Cash on delivery';
