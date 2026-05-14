const express = require("express");
const {
  getTests,
  createBooking,
  getBookings,
  getReports,
  downloadReceipt
} = require("../controllers/patientController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/tests", protect, allowRoles("patient"), getTests);
router.post("/book-test", protect, allowRoles("patient"), createBooking);
router.post("/bookings", protect, allowRoles("patient"), createBooking);
router.get("/bookings", protect, allowRoles("patient"), getBookings);
router.get("/reports", protect, allowRoles("patient"), getReports);
router.get("/receipts/:bookingId", protect, allowRoles("patient"), downloadReceipt);

module.exports = router;
