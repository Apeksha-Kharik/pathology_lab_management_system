// Compatibility routes use the same verified payment flow as the patient dashboard.
const onlinePayment = require("./onlinePaymentController");

const adaptBookingId = (handler) => (req, res) => {
  req.params.id = req.params.bookingId;
  return handler(req, res);
};

module.exports = {
  createPaymentOrder: adaptBookingId(onlinePayment.createOrder),
  verifyPayment: adaptBookingId(onlinePayment.verifyPayment)
};
