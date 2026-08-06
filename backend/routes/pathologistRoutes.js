const express = require("express");
const { getPendingReports, getAllReports, getPathologistProfile, uploadDigitalSignature, approveReport, rejectReport } = require("../controllers/pathologistController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { uploadSignature } = require("../middleware/signatureUpload");

const router = express.Router();

router.get("/profile", protect, allowRoles("pathologist"), getPathologistProfile);
router.post("/profile/signature", protect, allowRoles("pathologist"), uploadSignature, uploadDigitalSignature);
router.get("/reports", protect, allowRoles("pathologist"), getPendingReports);
router.get("/reports/all", protect, allowRoles("pathologist"), getAllReports);
router.patch("/reports/:reportId/approve", protect, allowRoles("pathologist"), approveReport);
router.patch("/reports/:reportId/reject", protect, allowRoles("pathologist"), rejectReport);

module.exports = router;
