const Booking = require('../models/Booking');
const notifications = require('./patientNotifications');

// Called only after the receptionist's PDF response finishes successfully.
const notifyGeneratedReceipt = async booking => {
  if (booking.paymentStatus !== 'Paid') return;
  const lockUntil = new Date(Date.now() + 60000);
  try {
    const claimed = await Booking.findOneAndUpdate({
      _id: booking._id, paymentStatus: 'Paid', receiptReadyNotifiedAt: null,
      $or: [{ receiptReadyNotificationLockUntil: null }, { receiptReadyNotificationLockUntil: { $lte: new Date() } }]
    }, { $set: { receiptReadyNotificationLockUntil: lockUntil } }, { new: true });
    if (!claimed) return;
    const result = await notifications.notifyReceiptReady(booking);
    await Booking.updateOne({ _id: booking._id, receiptReadyNotificationLockUntil: lockUntil }, {
      ...(result.sent ? { $set: { receiptReadyNotifiedAt: new Date() } } : {}),
      $unset: { receiptReadyNotificationLockUntil: 1 }
    });
  } catch (error) { console.error('Generated receipt notification failed:', error.message); }
};

module.exports = { notifyGeneratedReceipt };
