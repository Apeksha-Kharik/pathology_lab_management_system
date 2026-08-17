const Booking = require("../models/Booking");
const Report = require("../models/Report");
const User = require("../models/User");
const fs = require("fs");
const { sendEmail } = require("../config/email");
const { writeAuditLog } = require("../utils/auditLogger");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const signerFields = "name qualification registrationNumber signatureUrl";

const removeUploadedFile = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

const hasValidImageHeader = (filePath) => {
  const header = Buffer.alloc(8);
  const descriptor = fs.openSync(filePath, "r");
  fs.readSync(descriptor, header, 0, 8, 0);
  fs.closeSync(descriptor);
  const isPng = header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  return isPng || isJpeg;
};

const getPathologistProfile = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    qualification: req.user.qualification || "",
    registrationNumber: req.user.registrationNumber || "",
    signatureUrl: req.user.signatureUrl || ""
  });
};

const uploadDigitalSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose a PNG, JPG or JPEG signature image" });
    }

    if (!hasValidImageHeader(req.file.path)) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "The selected file is not a valid PNG or JPEG image" });
    }

    const qualification = String(req.body.qualification || "").trim();
    const registrationNumber = String(req.body.registrationNumber || "").trim();
    if (!qualification || !registrationNumber) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Qualification and registration number are required" });
    }

    const previousSignatureUrl = req.user.signatureUrl || "";
    const signatureUrl = `/uploads/signatures/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { signatureUrl, qualification, registrationNumber },
      { new: true, runValidators: true }
    ).select("-password");

    await writeAuditLog({
      actor: req.user,
      action: previousSignatureUrl ? "SIGNATURE_REPLACED" : "SIGNATURE_UPLOADED",
      entityType: "User",
      entityId: user._id,
      details: { previousSignatureUrl, signatureUrl }
    });

    res.json({ message: previousSignatureUrl ? "Digital signature replaced successfully" : "Digital signature uploaded successfully", user });
  } catch (error) {
    removeUploadedFile(req.file);
    res.status(500).json({ message: "Signature upload failed", error: error.message });
  }
};
const generatePatientCode = () => `PID${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ pathologistId: req.user._id, status: { $in: ["Pending Approval", "Pending Review"] } })
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone")
      .populate("approvedBy", signerFields)
      .sort({ updatedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending reports" });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({
      $or: [{ pathologistId: req.user._id }, { approvedBy: req.user._id }],
      status: { $in: ["Pending Approval", "Pending Review", "Approved", "Rejected"] }
    })
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone")
      .populate("approvedBy", signerFields)
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
    if (String(report.pathologistId || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "This report is assigned to another pathologist" });
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
    const { pathologistRemarks } = req.body;
    const pathologist = await User.findById(req.user._id).select(signerFields);

    if (!pathologist?.signatureUrl) {
      return res.status(400).json({ message: "Upload your digital signature before approving a report" });
    }
    if (!pathologist.qualification || !pathologist.registrationNumber) {
      return res.status(400).json({ message: "Add your qualification and registration number before approving a report" });
    }

    const report = await Report.findById(req.params.reportId)
      .populate("bookingId")
      .populate("userId", "name email phone")
      .populate("technicianId", "name email phone");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (String(report.pathologistId || "") !== String(req.user._id)) {
      return res.status(403).json({ message: "This report is assigned to another pathologist" });
    }

    if (!["Pending Approval", "Pending Review"].includes(report.status)) {
      return res.status(409).json({ message: "Only a pending report can be approved" });
    }

    report.pathologistSignature = pathologist.name;
    report.pathologistSignatureImage = pathologist.signatureUrl;
    report.pathologistRemarks = pathologistRemarks || "";
    report.pathologistId = pathologist._id;
    report.approvedBy = pathologist._id;
    report.approvedPathologistName = pathologist.name;
    report.approvedPathologistQualification = pathologist.qualification;
    report.approvedPathologistRegistrationNumber = pathologist.registrationNumber;
    report.status = "Approved";
    report.reportStatus = "Approved";
    report.finalStatus = "Report Ready";
    report.approvedAt = new Date();
    report.rejectionReason = "";
    await report.save();

    const booking = await Booking.findById(report.bookingId._id);
    if (booking) {
      if (!booking.patientCode) booking.patientCode = generatePatientCode();
      booking.bookingStatus = "Report Ready";
      booking.status = "Report Ready";
      await booking.save();
    }

    await writeAuditLog({
      actor: req.user,
      action: "REPORT_APPROVED",
      entityType: "Report",
      entityId: report._id,
      details: { bookingId: report.bookingId._id, patientId: report.userId?._id }
    });

    const reportEmail = report.userId?.email || report.bookingId?.email;
    if (reportEmail) {
      sendEmail({
        to: reportEmail,
        subject: "Your report is ready",
        text: "Your report is ready.\nPlease login to dashboard to download report."
      }).catch((error) => console.error("Report notification email failed:", error.message));
    }
    const reportPhone = report.bookingId?.phone || report.userId?.phone;
    if (reportPhone && booking) {
      sendWhatsAppMessage({
        to: reportPhone,
        body: [
          "INDIPATH report is ready.",
          "",
          `Patient ID: ${booking.patientCode || "Pending"}`,
          `Booking ID: ${booking.bookingCode}`,
          `Test: ${booking.testName}`,
          "Please login to your dashboard to download the report."
        ].join("\n")
      }).catch((error) => console.error("Report WhatsApp notification failed:", error.message));
    }

    await report.populate("approvedBy", signerFields);
    res.json({ message: "Report approved successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Report approval failed", error: error.message });
  }
};

module.exports = { getPendingReports, getAllReports, getPathologistProfile, uploadDigitalSignature, approveReport, rejectReport };
