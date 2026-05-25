const Booking = require("../models/Booking");
const Report = require("../models/Report");
const { sendEmail } = require("../config/email");

const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: { $in: ["Pending Approval", "Pending Review"] } })
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone")
      .sort({ updatedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending reports" });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: { $in: ["Pending Approval", "Pending Review", "Approved", "Rejected"] } })
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone")
      .sort({ updatedAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pathologist reports" });
  }
};

const rejectReport = async (req, res) => {
  try {
    const { rejectionReason, pathologistRemarks } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const report = await Report.findById(req.params.reportId).populate("bookingId");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "Rejected";
    report.reportStatus = "Rejected";
    report.finalStatus = "Correction Needed";
    report.rejectionReason = rejectionReason;
    report.pathologistId = req.user._id;
    report.pathologistRemarks = pathologistRemarks || "";
    report.pathologistSignature = "";
    report.pathologistSignatureImage = "";
    await report.save();

    const booking = await Booking.findById(report.bookingId._id);
    if (booking) {
      booking.bookingStatus = "Processing";
      booking.status = "Processing";
      await booking.save();
    }

    res.json({ message: "Report rejected and sent for technician correction", report });
  } catch (error) {
    res.status(500).json({ message: "Report rejection failed", error: error.message });
  }
};

const approveReport = async (req, res) => {
  try {
    const { pathologistSignature, pathologistRemarks, pathologistSignatureImage } = req.body;

    if (!pathologistSignature) {
      return res.status(400).json({ message: "Pathologist signature is required" });
    }

    const report = await Report.findById(req.params.reportId)
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.pathologistSignature = pathologistSignature;
    report.pathologistSignatureImage = pathologistSignatureImage || report.pathologistSignatureImage || "";
    report.pathologistRemarks = pathologistRemarks || "";
    report.pathologistId = req.user._id;
    report.status = "Approved";
    report.reportStatus = "Approved";
    report.finalStatus = "Report Ready";
    report.approvedAt = new Date();
    report.rejectionReason = "";
    await report.save();

    const booking = await Booking.findById(report.bookingId._id);
    booking.bookingStatus = "Report Ready";
    booking.status = "Report Ready";
    await booking.save();

    const reportEmail = report.userId?.email || report.bookingId?.email;
    if (reportEmail) {
      await sendEmail({
        to: reportEmail,
        subject: "Your report is ready",
        text: "Your report is ready.\nPlease login to dashboard to download report."
      });
    }

    res.json({ message: "Report approved and patient notified", report });
  } catch (error) {
    res.status(500).json({ message: "Report approval failed", error: error.message });
  }
};

module.exports = { getPendingReports, getAllReports, approveReport, rejectReport };
