const express = require("express");
const {
  getPendingBookings,
  getAllBookings,
  getReceptionistTests,
  getTechnicians,
  createWalkInBooking,
  updateBookingStatus,
  assignTechnician,
  markPaymentPaid,
  downloadReceptionistReceipt
} = require("../controllers/receptionistController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/pending-bookings", protect, allowRoles("receptionist", "admin"), getPendingBookings);
router.get("/bookings", protect, allowRoles("receptionist", "admin"), getAllBookings);
router.get("/tests", protect, allowRoles("receptionist", "admin"), getReceptionistTests);
router.get("/technicians", protect, allowRoles("receptionist", "admin"), getTechnicians);
router.post("/walk-in-bookings", protect, allowRoles("receptionist", "admin"), createWalkInBooking);
router.patch("/bookings/:id/status", protect, allowRoles("receptionist", "admin"), updateBookingStatus);
router.patch("/bookings/:id/technician", protect, allowRoles("receptionist", "admin"), assignTechnician);
router.patch("/bookings/:id/payment", protect, allowRoles("receptionist", "admin"), markPaymentPaid);
router.get("/bookings/:id/receipt", protect, allowRoles("receptionist", "admin"), downloadReceptionistReceipt);

module.exports = router;
