const express = require("express");
const { getPendingReports, getAllReports, approveReport, rejectReport } = require("../controllers/pathologistController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/reports", protect, allowRoles("pathologist", "admin"), getPendingReports);
router.get("/reports/all", protect, allowRoles("pathologist", "admin"), getAllReports);
router.patch("/reports/:reportId/approve", protect, allowRoles("pathologist", "admin"), approveReport);
router.patch("/reports/:reportId/reject", protect, allowRoles("pathologist", "admin"), rejectReport);

module.exports = router;
