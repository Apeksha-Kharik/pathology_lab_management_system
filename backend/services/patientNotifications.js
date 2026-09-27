const { sendWhatsAppMessage, sendWhatsAppDocument } = require('./whatsappService');
const { generateReceiptPdf, generateReportPdf } = require('./patientPdfService');

const notifyBookingRequested = async (booking) => {
 try {
  const amount = 'INR ' + Number(booking.amount).toFixed(2);
  const body = `IndiPath: We received your ${booking.testName} booking request. The receptionist will confirm or reject it.\n\nBooking ID: ${booking.bookingCode}\nDate: ${booking.bookingDate}\nTime Slot: ${booking.timeSlot}\nAmount: ${amount}`;
  const demoTemplate = process.env.WHATSAPP_TEMPLATE_HELLO;
  return await sendWhatsAppMessage({ to: booking.phone || booking.userId?.phone, event: 'booking_requested', body,
   ...(demoTemplate ? { templateName: demoTemplate, parameters: [] } : { parameters: [booking.name, booking.bookingCode, booking.testName, booking.bookingDate, booking.timeSlot, amount] }) });
 } catch (error) { console.error('Booking WhatsApp notification failed:', error.message); return { sent: false }; }
};

// Provider/PDF failures must not undo saved payments or approvals.
const notifyPaymentReceived = async (booking, paymentId) => {
 try {
  const document = await generateReceiptPdf(booking);
  return await sendWhatsAppDocument({ to: booking.phone || booking.userId?.phone, event: 'payment_received', ...document,
   caption: 'IndiPath: Payment received. Your receipt is attached.',
   parameters: [booking.name, booking.bookingCode, 'INR ' + Number(booking.amount).toFixed(2)] });
 } catch (error) { console.error('Receipt WhatsApp notification failed:', error.message); return { sent: false }; }
};
const notifyReportReady = async (report) => {
 try {
  const booking = report.bookingId;
  const document = await generateReportPdf(report);
  return await sendWhatsAppDocument({ to: booking.phone || report.userId?.phone, event: 'report_ready', ...document,
   caption: 'IndiPath: Your approved report is attached.', parameters: [booking.name, booking.bookingCode] });
 } catch (error) { console.error('Report WhatsApp notification failed:', error.message); return { sent: false }; }
};
// Routine progress remains visible in the app without WhatsApp messages.
const notifySampleCollected = async () => ({ sent: false, skipped: true });
module.exports = { notifyBookingRequested, notifyPaymentReceived, notifyReportReady, notifySampleCollected };
