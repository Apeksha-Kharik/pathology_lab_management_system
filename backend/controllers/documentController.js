const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const { renderReportPdf, buildPatientPdfFilename } = require('../services/patientPdfService');

const downloadTechnicianReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reportId)) return res.status(400).json({ message: 'Invalid report ID' });
    const report = await Report.findById(req.params.reportId).populate('bookingId').populate('approvedBy', 'name qualification registrationNumber signatureUrl');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    // Ownership follows the submitting technician even if the booking is reassigned.
    if (String(report.technicianId || '') !== String(req.user._id)) return res.status(403).json({ message: 'You cannot download this report' });
    if (!['Pending Approval', 'Pending Review', 'Approved', 'Rejected'].includes(report.status)) return res.status(409).json({ message: 'Submit the report before downloading its PDF' });
    const filename = buildPatientPdfFilename(report.bookingId?.name, report.bookingId?.patientCode || report.reportId, 'RPT');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    renderReportPdf(report, {}, res);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: 'Unable to download report PDF' });
    else res.destroy(error);
  }
};

const canAccess = (user, report, booking, requireApproved = true) => {
  const role = String(user.role || "").toLowerCase();
  const userId = String(user._id);
  if (["admin", "receptionist"].includes(role)) return true;
  if (role === "patient") return String(report?.userId?._id || report?.userId || booking?.userId || "") === userId && (!requireApproved || report?.status === "Approved");
  if (role === "technician") return String(report?.technicianId?._id || report?.technicianId || booking?.assignedTechnician || "") === userId;
  if (role === "pathologist") return [report?.pathologistId, report?.approvedBy, report?.authorizedBy].some((value) => String(value?._id || value || "") === userId);
  return false;
};

const reportDocument = (asPdf = false) => async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reportId)) return res.status(400).json({ message: "Invalid report ID" });
    const report = await Report.findById(req.params.reportId)
      .populate("bookingId")
      .populate("userId", "name email phone age gender")
      .populate("technicianId", "name")
      .populate("approvedBy", "name qualification registrationNumber signatureUrl")
      .populate("authorizedBy", "name qualification registrationNumber signatureUrl");
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!canAccess(req.user, report, report.bookingId)) return res.status(403).json({ message: "You cannot access this report" });
    if (asPdf) {
      if (!['Pending Approval', 'Pending Review', 'Approved', 'Rejected'].includes(report.status)) return res.status(409).json({ message: 'Submit the report before viewing its PDF' });
      const booking = report.bookingId || {};
      const filename = buildPatientPdfFilename(booking.name, booking.patientCode || report.reportId, 'RPT');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      renderReportPdf(report, report.userId || {}, res);
      return;
    }
    const payment = await Payment.findOne({ bookingId: report.bookingId?._id }).select("amount method status transactionId receiptNumber receiptId paidAt paymentDate");
    res.json({ report, booking: report.bookingId, payment });
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: "Unable to load report document" });
    else res.destroy(error);
  }
};
const getReportDocument = reportDocument();
const getReportPdf = reportDocument(true);

const getReceiptDocument = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.bookingId)) return res.status(400).json({ message: "Invalid booking ID" });
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const report = await Report.findOne({ bookingId: booking._id })
      .populate("approvedBy", "name qualification registrationNumber signatureUrl")
      .populate("authorizedBy", "name qualification registrationNumber signatureUrl");
    if (!canAccess(req.user, report || {}, booking, false)) return res.status(403).json({ message: "You cannot access this receipt" });
    if (booking.paymentStatus !== "Paid") return res.status(409).json({ message: "Receipt is available after payment" });
    const payment = await Payment.findOne({ bookingId: booking._id });
    res.json({ booking, report, payment });
  } catch (error) {
    res.status(500).json({ message: "Unable to load receipt document", error: error.message });
  }
};

module.exports = { getReportDocument, getReportPdf, getReceiptDocument, downloadTechnicianReport };
