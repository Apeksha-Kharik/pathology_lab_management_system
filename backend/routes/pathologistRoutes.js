const express = require("express");
const { getPendingReports, approveReport } = require("../controllers/pathologistController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/reports", protect, allowRoles("pathologist", "admin"), getPendingReports);
router.patch("/reports/:reportId/approve", protect, allowRoles("pathologist", "admin"), approveReport);

module.exports = router;
