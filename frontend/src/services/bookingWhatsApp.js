// Public lab contact only; never put a Cloud API token in frontend configuration.
const labNumber = String(import.meta.env.VITE_LAB_WHATSAPP_NUMBER || "919930608509").replace(/\D/g, "");

export function bookingWhatsAppUrl(booking) {
  const text = [
    "Hello IndiPath Lab, I have submitted a booking. Please confirm it.",
    `Booking ID: ${booking.bookingCode}`,
    `Patient: ${booking.name}`,
    `Test/package: ${booking.testName}`,
    `Date: ${booking.bookingDate}`,
    `Time: ${booking.timeSlot}`
  ].join("\n");
  return `https://wa.me/${labNumber}?text=${encodeURIComponent(text)}`;
}
