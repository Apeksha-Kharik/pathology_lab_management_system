const { sendWhatsAppMessage } = require('./whatsappService');

const notifyBookingRequested = async (booking) => {
 try {
  const amount = 'INR ' + Number(booking.amount).toFixed(2);
  const body = `IndiPath: We received your ${booking.testName} booking request. The receptionist will confirm or reject it.\n\nBooking ID: ${booking.bookingCode}\nDate: ${booking.bookingDate}\nTime Slot: ${booking.timeSlot}\nAmount: ${amount}`;
  return await sendWhatsAppMessage({ to: booking.phone || booking.userId?.phone, event: 'booking_requested', body,
   parameters: [booking.name, booking.bookingCode, booking.testName, booking.bookingDate, booking.timeSlot, amount] });
 } catch (error) { console.error('Booking WhatsApp notification failed:', error.message); return { sent: false }; }
};

const notifyBookingConfirmed = async (booking) => {
 try {
  const amount = 'INR ' + Number(booking.amount).toFixed(2);
  const body = `IndiPath: Your ${booking.testName} booking has been confirmed by the receptionist.\n\nPatient ID: ${booking.patientCode}\nBooking ID: ${booking.bookingCode}\nDate: ${booking.bookingDate}\nTime Slot: ${booking.timeSlot}\nAmount: ${amount}`;
  return await sendWhatsAppMessage({ to: booking.phone || booking.userId?.phone, event: 'booking_confirmed', body,
   parameters: [booking.name, booking.patientCode, booking.bookingCode, booking.testName, booking.bookingDate, booking.timeSlot, amount] });
 } catch (error) { console.error('Confirmation WhatsApp notification failed:', error.message); return { sent: false }; }
};

// Notification failures must not undo saved payments or approvals.
const notifyPaymentReceived = async (booking) => {
 try {
  if (booking.paymentStatus !== 'Paid') return { sent: false, skipped: true };
  const body = `IndiPath: Hello ${booking.name}, your payment has been received and your receipt is ready.\n\nBooking ID: ${booking.bookingCode}\nReceipt ID: ${booking.receiptId || booking.receiptNumber || 'N/A'}\nTest/package: ${booking.testName}\nAmount: INR ${Number(booking.amount).toFixed(2)}\nPlease log in to your patient dashboard to download your receipt.`;
  return await sendWhatsAppMessage({ to: booking.phone || booking.userId?.phone, event: 'payment_received', body });
 } catch (error) { console.error('Receipt WhatsApp notification failed:', error.message); return { sent: false }; }
};
const notifyReportReady = async (report) => {
 try {
  if (report.status !== 'Approved') return { sent: false, skipped: true };
  const booking = report.bookingId;
  const body = `IndiPath: Hello ${booking.name}, your report has been approved and is ready.\n\nBooking ID: ${booking.bookingCode}\nTest/package: ${booking.testName || report.testName}\nPlease log in to your patient dashboard to view and download your report.`;
  return await sendWhatsAppMessage({ to: booking.phone || report.userId?.phone, event: 'report_ready', body });
 } catch (error) { console.error('Report WhatsApp notification failed:', error.message); return { sent: false }; }
};
// Routine progress remains visible in the app without WhatsApp messages.
const notifySampleCollected = async () => ({ sent: false, skipped: true });
module.exports = { notifyBookingRequested, notifyBookingConfirmed, notifyPaymentReceived, notifyReportReady, notifySampleCollected };
