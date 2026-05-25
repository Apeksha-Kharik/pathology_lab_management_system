const Booking = require("../models/Booking");
const Report = require("../models/Report");

const normalizeResults = (results = []) => {
  return results
    .filter((row) => row.parameter && row.value)
    .map((row) => ({
      parameter: row.parameter,
      value: row.value,
      unit: row.unit || "",
      referenceRange: row.normalRange || row.referenceRange || "",
      normalRange: row.normalRange || row.referenceRange || ""
    }));
};

const getAssignedBooking = async (bookingId, technicianId) => {
  return Booking.findOne({
    _id: bookingId,
    assignedTechnician: technicianId
  });
};

const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedTechnician: req.user._id,
      bookingStatus: { $in: ["Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready"] }
    }).sort({ updatedAt: -1 });

    const reports = await Report.find({
      bookingId: { $in: bookings.map((booking) => booking._id) }
    });

    const reportByBooking = reports.reduce((acc, report) => {
      acc[report.bookingId.toString()] = report;
      return acc;
    }, {});

    res.json(bookings.map((booking) => ({
      ...booking.toObject(),
      report: reportByBooking[booking._id.toString()] || null
    })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching technician bookings" });
  }
};

const startTest = async (req, res) => {
  try {
    const booking = await getAssignedBooking(req.params.bookingId, req.user._id);

    if (!booking) {
      return res.status(404).json({ message: "Assigned booking not found" });
    }

    if (booking.sampleStatus !== "Collected" && booking.bookingStatus !== "Sample Collected") {
      return res.status(400).json({ message: "Test can be started only after technician assignment and sample collection" });
    }

    booking.testStarted = true;
    booking.testStartedAt = new Date();
    booking.bookingStatus = "Processing";
    booking.status = "Processing";
    await booking.save();

    res.json({ message: "Test started successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Unable to start test", error: error.message });
  }
};

const updateSampleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Sample Collected", "Processing"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid technician status" });
    }

    const booking = await getAssignedBooking(req.params.bookingId, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: "Assigned booking not found" });
    }

    if (status === "Sample Collected") {
      booking.sampleStatus = "Collected";
    }

    booking.bookingStatus = status;
    booking.status = status;
    await booking.save();

    res.json({ message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: "Status update failed", error: error.message });
  }
};

const saveReportDraft = async (req, res) => {
  try {
    const { results, technicianRemarks } = req.body;
    const cleanResults = normalizeResults(results);

    if (!cleanResults.length) {
      return res.status(400).json({ message: "At least one test result is required" });
    }

    const booking = await getAssignedBooking(req.params.bookingId, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: "Assigned booking not found" });
    }

    const existingReport = await Report.findOne({ bookingId: booking._id });
    if (existingReport && ["Pending Approval", "Pending Review", "Approved"].includes(existingReport.status)) {
      return res.status(400).json({ message: "Submitted reports cannot be edited by technician" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId || booking.patientId,
        bookingId: booking._id,
        technicianId: req.user._id,
        testName: booking.testName,
        results: cleanResults,
        technicianRemarks,
        status: "Draft",
        reportStatus: "Draft",
        finalStatus: "Draft",
        rejectionReason: existingReport?.rejectionReason || ""
      },
      { upsert: true, new: true, runValidators: true }
    );

    if (!["Processing", "Pending Report Approval", "Report Ready"].includes(booking.bookingStatus)) {
      booking.bookingStatus = "Processing";
      booking.status = "Processing";
    }
    await booking.save();

    res.json({ message: "Report saved as draft", report });
  } catch (error) {
    res.status(500).json({ message: "Report draft save failed", error: error.message });
  }
};

const submitReport = async (req, res) => {
  try {
    const { results, technicianRemarks } = req.body;
    const cleanResults = normalizeResults(results);

    if (!cleanResults.length) {
      return res.status(400).json({ message: "At least one test result is required" });
    }

    const booking = await getAssignedBooking(req.params.bookingId, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: "Assigned booking not found" });
    }

    const existingReport = await Report.findOne({ bookingId: booking._id });
    if (existingReport && ["Pending Approval", "Pending Review", "Approved"].includes(existingReport.status)) {
      return res.status(400).json({ message: "Report has already been submitted" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId || booking.patientId,
        bookingId: booking._id,
        technicianId: req.user._id,
        testName: booking.testName,
        results: cleanResults,
        technicianRemarks,
        status: "Pending Approval",
        reportStatus: "Pending Approval",
        finalStatus: "Pending Approval",
        submittedAt: new Date(),
        rejectionReason: existingReport?.rejectionReason || ""
      },
      { upsert: true, new: true, runValidators: true }
    );

    booking.bookingStatus = "Pending Report Approval";
    booking.status = "Pending Report Approval";
    await booking.save();

    res.json({ message: "Report submitted and marked pending approval", report });
  } catch (error) {
    res.status(500).json({ message: "Report submission failed", error: error.message });
  }
};

module.exports = { getTechnicianBookings, updateSampleStatus, startTest, saveReportDraft, submitReport };
