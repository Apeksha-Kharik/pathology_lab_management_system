const express = require("express");
const { getReportDocument, getReceiptDocument } = require("../controllers/documentController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();
const documentRoles = allowRoles("admin", "technician", "pathologist", "receptionist", "patient");

router.get("/reports/:reportId", protect, documentRoles, getReportDocument);
router.get("/receipts/:bookingId", protect, documentRoles, getReceiptDocument);

module.exports = router;
