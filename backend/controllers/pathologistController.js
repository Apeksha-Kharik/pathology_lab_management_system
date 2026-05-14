const Booking = require("../models/Booking");
const Report = require("../models/Report");
const { sendEmail } = require("../config/email");

const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "Pending Review" })
      .populate("bookingId")
      .populate("userId", "name email phone")
      .sort({ updatedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending reports" });
  }
};

const approveReport = async (req, res) => {
  try {
    const { pathologistSignature } = req.body;

    if (!pathologistSignature) {
      return res.status(400).json({ message: "Pathologist signature is required" });
    }

    const report = await Report.findById(req.params.reportId)
      .populate("bookingId")
      .populate("userId", "name email phone");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.pathologistSignature = pathologistSignature;
    report.status = "Approved";
    report.approvedAt = new Date();
    await report.save();

    const booking = await Booking.findById(report.bookingId._id);
    booking.bookingStatus = "Report Ready";
    booking.status = "Report Ready";
    await booking.save();

    await sendEmail({
      to: report.userId.email,
      subject: "Your report is ready",
      text: "Your report is ready.\nPlease login to dashboard to download report."
    });

    res.json({ message: "Report approved and patient notified", report });
  } catch (error) {
    res.status(500).json({ message: "Report approval failed", error: error.message });
  }
};

module.exports = { getPendingReports, approveReport };
