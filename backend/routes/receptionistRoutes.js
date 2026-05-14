const express = require("express");
const {
  getPendingBookings,
  getAllBookings,
  updateBookingStatus,
  markPaymentPaid
} = require("../controllers/receptionistController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/pending-bookings", protect, allowRoles("receptionist", "admin"), getPendingBookings);
router.get("/bookings", protect, allowRoles("receptionist", "admin"), getAllBookings);
router.patch("/bookings/:id/status", protect, allowRoles("receptionist", "admin"), updateBookingStatus);
router.patch("/bookings/:id/payment", protect, allowRoles("receptionist", "admin"), markPaymentPaid);

module.exports = router;
