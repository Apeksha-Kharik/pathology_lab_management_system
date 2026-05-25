const express = require("express");
const {
  getTechnicianBookings,
  updateSampleStatus,
  startTest,
  saveReportDraft,
  submitReport
} = require("../controllers/technicianController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/bookings", protect, allowRoles("technician", "admin"), getTechnicianBookings);
router.patch("/bookings/:bookingId/status", protect, allowRoles("technician", "admin"), updateSampleStatus);
router.patch("/bookings/:bookingId/start", protect, allowRoles("technician", "admin"), startTest);
router.post("/bookings/:bookingId/report/draft", protect, allowRoles("technician", "admin"), saveReportDraft);
router.post("/bookings/:bookingId/report", protect, allowRoles("technician", "admin"), submitReport);

module.exports = router;
