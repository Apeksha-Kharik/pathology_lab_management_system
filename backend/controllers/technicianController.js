const Booking = require("../models/Booking");
const Report = require("../models/Report");
const Test = require("../models/Test");
const Package = require("../models/Package");
const TechnicianAssignment = require("../models/TechnicianAssignment");
const mongoose = require("mongoose");
const User = require("../models/User");

const generateSampleId = () => `SMP${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
const generateReportId = () => `RPT${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

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

const getReportTemplateDetails = (booking) => {
  const source = booking.testId || booking.packageId;
  return {
    reportLetterhead: source?.reportLetterhead || "",
    reportDescription: source?.reportDescription || ""
  };
};

const selectFairPathologist = async () => {
  const pathologists = await User.find({ role: "pathologist" }).select("name email phone role").sort({ name: 1 });

  if (!pathologists.length) {
    return null;
  }

  const [workloads, recentAssignments] = await Promise.all([
    Report.aggregate([
      {
        $match: {
          pathologistId: { $ne: null },
          status: { $in: ["Pending Approval", "Pending Review"] }
        }
      },
      { $group: { _id: "$pathologistId", count: { $sum: 1 } } }
    ]),
    Report.find({ pathologistId: { $ne: null } }).select("pathologistId updatedAt").sort({ updatedAt: -1 })
  ]);

  const workloadByPathologist = new Map(workloads.map((item) => [String(item._id), item.count]));
  const lastAssignedByPathologist = new Map();
  recentAssignments.forEach((report) => {
    const pathologistId = String(report.pathologistId);
    if (!lastAssignedByPathologist.has(pathologistId)) {
      lastAssignedByPathologist.set(pathologistId, report.updatedAt?.getTime?.() || 0);
    }
  });

  return pathologists
    .map((pathologist) => ({
      pathologist,
      workload: workloadByPathologist.get(String(pathologist._id)) || 0,
      lastAssignedAt: lastAssignedByPathologist.get(String(pathologist._id)) || 0
    }))
    .sort((a, b) => (
      a.workload - b.workload ||
      a.lastAssignedAt - b.lastAssignedAt ||
      a.pathologist.name.localeCompare(b.pathologist.name)
    ))[0].pathologist;
};

const normalizeTemplateName = (name = "") => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedTechnician: req.user._id,
      bookingStatus: { $in: ["Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready"] }
    }).populate("testId", "reportTemplate reportDescription reportLetterhead").populate("packageId", "reportTemplate reportDescription reportLetterhead includedTests").populate("packageTests", "testName reportTemplate reportDescription reportLetterhead").sort({ updatedAt: -1 });

    const reports = await Report.find({
      bookingId: { $in: bookings.map((booking) => booking._id) }
    });
    const bookingNames = bookings.map((booking) => booking.testName).filter(Boolean);
    const [fallbackTests, fallbackPackages] = await Promise.all([
      Test.find({ testName: { $in: bookingNames } }).select("testName reportTemplate reportDescription reportLetterhead"),
      Package.find({ packageName: { $in: bookingNames } }).select("packageName reportTemplate reportDescription reportLetterhead")
    ]);
    const testByName = new Map(fallbackTests.map((test) => [normalizeTemplateName(test.testName), test]));
    const packageByName = new Map(fallbackPackages.map((packageItem) => [normalizeTemplateName(packageItem.packageName), packageItem]));

    const reportByBooking = reports.reduce((acc, report) => {
      acc[report.bookingId.toString()] = report;
      return acc;
    }, {});

    res.json(bookings.map((booking) => {
      const bookingData = booking.toObject();
      const hasTestTemplate = Boolean(bookingData.testId?.reportTemplate?.length || bookingData.testId?.reportLetterhead || bookingData.testId?.reportDescription);
      const hasPackageTemplate = Boolean(bookingData.packageId?.reportTemplate?.length || bookingData.packageId?.reportLetterhead || bookingData.packageId?.reportDescription);
      return {
        ...bookingData,
        testId: hasTestTemplate ? bookingData.testId : (testByName.get(normalizeTemplateName(booking.testName)) || bookingData.testId),
        packageId: hasPackageTemplate ? bookingData.packageId : (packageByName.get(normalizeTemplateName(booking.testName)) || bookingData.packageId),
        report: reportByBooking[booking._id.toString()] || null
      };
    }));
  } catch (error) {
    res.status(500).json({ message: "Error fetching technician bookings" });
  }
};

const getAssignmentRequests = async (req, res) => {
  try {
    const assignments = await TechnicianAssignment.find({ technician: req.user._id })
      .populate("booking", "bookingCode patientCode name testName sampleType collectionType bookingDate timeSlot bookingStatus paymentStatus")
      .populate("requestedBy", "name role")
      .sort({ requestedAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Unable to load assignment requests" });
  }
};

const acceptAssignmentRequest = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.assignmentId)) {
    return res.status(400).json({ message: "Invalid assignment request ID" });
  }
  const session = await mongoose.startSession();
  try {
    let acceptedAssignment;
    let assignedBooking;
    await session.withTransaction(async () => {
      acceptedAssignment = await TechnicianAssignment.findOneAndUpdate(
        { _id: req.params.assignmentId, technician: req.user._id, status: "PENDING" },
        { $set: { status: "ACCEPTED", respondedAt: new Date(), rejectionReason: "" } },
        { new: true, runValidators: true, session }
      );
      if (!acceptedAssignment) {
        const existing = await TechnicianAssignment.findById(req.params.assignmentId).session(session);
        const error = new Error(!existing || String(existing.technician) !== String(req.user._id)
          ? "Assignment request not found"
          : "This assignment request has already been handled.");
        error.status = !existing || String(existing.technician) !== String(req.user._id) ? 404 : 409;
        throw error;
      }

      assignedBooking = await Booking.findOneAndUpdate(
        { _id: acceptedAssignment.booking, assignedTechnician: null },
        {
          $set: {
            assignedTechnician: req.user._id,
            bookingStatus: "Technician Assigned",
            status: "Technician Assigned"
          }
        },
        { new: true, session }
      );
      if (!assignedBooking) {
        const error = new Error("The assignment has already been accepted by another technician.");
        error.status = 409;
        throw error;
      }
    });

    await acceptedAssignment.populate([
      { path: "booking", select: "bookingCode patientCode name testName sampleType collectionType bookingDate timeSlot bookingStatus paymentStatus" },
      { path: "requestedBy", select: "name role" }
    ]);
    res.json({ message: "Assignment request accepted.", assignment: acceptedAssignment, booking: assignedBooking });
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : (error.status || 500)).json({
      message: duplicate ? "The assignment has already been accepted by another technician." : (error.status ? error.message : "Unable to accept the assignment request")
    });
  } finally {
    await session.endSession();
  }
};

const rejectAssignmentRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment request ID" });
    }
    const rejectionReason = String(req.body.rejectionReason || "").trim();
    if (rejectionReason.length > 500) {
      return res.status(400).json({ message: "Rejection reason cannot exceed 500 characters." });
    }
    const assignment = await TechnicianAssignment.findOneAndUpdate(
      { _id: req.params.assignmentId, technician: req.user._id, status: "PENDING" },
      { $set: { status: "REJECTED", respondedAt: new Date(), rejectionReason } },
      { new: true, runValidators: true }
    );
    if (!assignment) {
      const existing = await TechnicianAssignment.findById(req.params.assignmentId);
      if (!existing || String(existing.technician) !== String(req.user._id)) {
        return res.status(404).json({ message: "Assignment request not found" });
      }
      return res.status(409).json({ message: "This assignment request has already been handled." });
    }
    await assignment.populate([
      { path: "booking", select: "bookingCode patientCode name testName sampleType collectionType bookingDate timeSlot bookingStatus paymentStatus" },
      { path: "requestedBy", select: "name role" }
    ]);
    res.json({ message: "Assignment request rejected.", assignment });
  } catch (error) {
    res.status(500).json({ message: "Unable to reject the assignment request" });
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

    if (!booking.sampleId) {
      booking.sampleId = generateSampleId();
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

const startReportEntry = async (req, res) => {
  try {
    const booking = await getAssignedBooking(req.params.bookingId, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: "Assigned booking not found" });
    }

    if (!booking.testStarted && booking.bookingStatus !== "Processing") {
      return res.status(400).json({ message: "Start the test before report entry" });
    }

    await booking.populate("testId", "reportDescription reportLetterhead");
    await booking.populate("packageId", "reportDescription reportLetterhead");
    const templateDetails = getReportTemplateDetails(booking);
    const existingReport = await Report.findOne({ bookingId: booking._id });

    if (existingReport && ["Pending Approval", "Pending Review", "Approved"].includes(existingReport.status)) {
      return res.status(400).json({ message: "Submitted reports cannot be edited by technician" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId || booking.patientId,
        bookingId: booking._id,
        reportId: existingReport?.reportId || generateReportId(),
        technicianId: req.user._id,
        testName: booking.testName,
        ...templateDetails,
        status: "Draft",
        reportStatus: "Draft",
        finalStatus: "Draft",
        rejectionReason: existingReport?.rejectionReason || ""
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: "Report entry started", report });
  } catch (error) {
    res.status(500).json({ message: "Report entry start failed", error: error.message });
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
    await booking.populate("testId", "reportDescription reportLetterhead");
    await booking.populate("packageId", "reportDescription reportLetterhead");
    const templateDetails = getReportTemplateDetails(booking);

    const existingReport = await Report.findOne({ bookingId: booking._id });
    if (existingReport && ["Pending Approval", "Pending Review", "Approved"].includes(existingReport.status)) {
      return res.status(400).json({ message: "Submitted reports cannot be edited by technician" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId || booking.patientId,
        bookingId: booking._id,
        reportId: existingReport?.reportId || generateReportId(),
        technicianId: req.user._id,
        testName: booking.testName,
        ...templateDetails,
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
    await booking.populate("testId", "reportDescription reportLetterhead");
    await booking.populate("packageId", "reportDescription reportLetterhead");
    const templateDetails = getReportTemplateDetails(booking);

    const existingReport = await Report.findOne({ bookingId: booking._id });
    if (existingReport && ["Pending Approval", "Pending Review", "Approved"].includes(existingReport.status)) {
      return res.status(400).json({ message: "Report has already been submitted" });
    }

    const pathologist = await selectFairPathologist();
    if (!pathologist) {
      return res.status(404).json({ message: "No pathologist users are available for report review" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId || booking.patientId,
        bookingId: booking._id,
        reportId: existingReport?.reportId || generateReportId(),
        technicianId: req.user._id,
        pathologistId: pathologist._id,
        testName: booking.testName,
        ...templateDetails,
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

    res.json({ message: `Report submitted to pathologist ${pathologist.name}`, report });
  } catch (error) {
    res.status(500).json({ message: "Report submission failed", error: error.message });
  }
};

module.exports = { getTechnicianBookings, getAssignmentRequests, acceptAssignmentRequest, rejectAssignmentRequest, updateSampleStatus, startTest, startReportEntry, saveReportDraft, submitReport };
