const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");
const Package = require("../models/Package");

const letterheadImagePath = path.join(__dirname, "..", "assets", "indipath-letterhead.png");
const patientCodeStatuses = ["Confirmed", "Arrived", "Technician Assigned", "Sample Collected", "Processing", "Pending Report Approval", "Completed", "Report Ready"];

const generatePatientCode = () => `PID${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

const ensurePatientCode = async (booking) => {
  if (!booking || booking.patientCode || !patientCodeStatuses.includes(booking.bookingStatus || booking.status)) {
    return booking;
  }

  booking.patientCode = generatePatientCode();
  await booking.save();
  return booking;
};

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";

const buildPatientPdfFilename = (name, patientCode) => {
  return `${safeFilePart(name)}-${safeFilePart(patientCode || "pending-patient-id")}.pdf`;
};

const drawLetterhead = (doc) => {
  if (fs.existsSync(letterheadImagePath)) {
    doc.image(letterheadImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.y = 120;
    return true;
  }

  doc.rect(0, 0, doc.page.width, 74).fill("#e7f5e9");
  doc.fillColor("#d62828").fontSize(25).font("Helvetica-Bold").text("INDIPATH", 50, 25);
  doc.fillColor("#123a82").fontSize(12).text("SUPER SPECIALITY PATHOLOGY LAB", 52, 53);
  doc.fillColor("#7a5a2b").fontSize(9).text("TEST REPORT", 515, 40, { width: 45, align: "center" });
  doc.fillColor("#111111");
  doc.y = 105;
  return false;
};

const drawDefaultFooter = (doc) => {
  doc.fillColor("#123a82").fontSize(9).text("INDIPATH Super Speciality Pathology Lab, 22 Mahapurush Complex, BazarPeth Kankavali, Tal. Kankavali - 416 602", 45, doc.page.height - 52, { width: 510, align: "center" });
  doc.text("02367-231970, 7448231970  |  indipathlab@gmail.com", { align: "center" });
};

const getTests = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { testName: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const tests = await Test.find(query).sort({ testName: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .populate("includedTests", "testName")
      .sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages" });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      address,
      collectionType,
      doctorNotes,
      email,
      homeSample,
      packageId,
      patientName,
      phone,
      testId,
      bookingDate,
      timeSlot,
      notes,
      age,
      gender,
      sampleType
    } = req.body;

    if ((!testId && !packageId) || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: "Select a test or package, preferred date and time slot" });
    }

    const bookingType = packageId ? "Package" : "Test";
    const selectedItem = packageId
      ? await Package.findOne({ _id: packageId, isActive: true })
      : await Test.findById(testId);
    if (!selectedItem) {
      return res.status(404).json({ message: `Selected ${bookingType.toLowerCase()} not found` });
    }

    const bookingCode = `BK${Date.now().toString().slice(-6)}`;
    const booking = await Booking.create({
      userId: req.user._id,
      patientId: req.user._id,
      testId: bookingType === "Test" ? selectedItem._id : undefined,
      packageId: bookingType === "Package" ? selectedItem._id : undefined,
      bookingType,
      name: patientName || req.user.name,
      phone: phone || req.user.phone,
      email: email || req.user.email,
      age: Number(age || req.user.age || 0),
      gender: gender || req.user.gender || "",
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      doctorNotes: doctorNotes || "",
      sampleType: sampleType || "",
      homeSample: Boolean(homeSample),
      collectionType: collectionType || (homeSample ? "Home Collection" : "Visit Lab"),
      address: address || "",
      testName: bookingType === "Package" ? selectedItem.packageName : selectedItem.testName,
      amount: selectedItem.price,
      status: "Pending Approval",
      bookingStatus: "Pending Approval",
      paymentStatus: "Unpaid",
      bookingCode
    });

    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: selectedItem.price,
      method: "cash",
      status: "pending"
    });

    res.status(201).json({ message: "Booking request submitted for receptionist approval", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const bookingsWithPatientIds = await Promise.all(bookings.map((booking) => ensurePatientCode(booking)));
    res.json(bookingsWithPatientIds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking history" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id, status: "Approved" })
      .populate("bookingId", "name patientCode bookingCode testName")
      .sort({ approvedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.reportId,
      userId: req.user._id,
      status: "Approved"
    }).populate("bookingId").populate("pathologistId", "name qualification");

    if (!report) {
      return res.status(404).json({ message: "Report not found or not ready" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = buildPatientPdfFilename(report.bookingId.name, report.bookingId.patientCode);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    const hasLetterheadImage = drawLetterhead(doc);
    const letterhead = report.reportLetterhead || "INDIPATH\nSUPER SPECIALITY PATHOLOGY LAB";
    if (!hasLetterheadImage) {
      doc.fillColor("#123a82").fontSize(14).font("Helvetica-Bold").text(letterhead, 50, 19, { width: 400, lineGap: 2 });
    }
    doc.x = 50;
    doc.fillColor("#111111");
    doc.fontSize(16).font("Helvetica-Bold").text("Diagnostic Report", 50, doc.y, { width: 495, align: "center" });
    const infoTop = doc.y + 14;
    const patientDetails = [
      ["Patient Name", report.bookingId.name], ["Age / Gender", `${report.bookingId.age || "N/A"} / ${report.bookingId.gender || "N/A"}`],
      ["Phone", report.bookingId.phone], ["Patient ID", report.bookingId.patientCode || "Pending"],
      ["Test", report.testName], ["Approved On", report.approvedAt ? report.approvedAt.toLocaleString("en-IN") : "N/A"]
    ];
    doc.rect(50, infoTop, 495, 18).fill("#5b6573");
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("PATIENT & TEST INFORMATION", 60, infoTop + 5);
    patientDetails.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column ? 305 : 60;
      const y = infoTop + 28 + (row * 18);
      doc.fillColor("#333333").fontSize(8).font("Helvetica-Bold").text(`${label}:`, x, y);
      doc.font("Helvetica").text(String(value || "N/A"), x + 76, y, { width: 160 });
    });
    doc.y = infoTop + 88;
    if (report.reportDescription) {
      doc.fontSize(10).fillColor("#444444").text(report.reportDescription, { align: "center" });
      doc.moveDown(1);
    }
    const tableTop = doc.y + 5;
    const columns = [50, 230, 335, 415];
    const widths = [180, 105, 80, 130];
    doc.rect(50, tableTop, 495, 19).fill("#5b6573");
    ["PARAMETER", "RESULT", "UNIT", "REFERENCE RANGE"].forEach((heading, index) => doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(heading, columns[index] + 5, tableTop + 6, { width: widths[index] - 8 }));
    let rowTop = tableTop + 19;
    report.results.forEach((result, index) => {
      const rowHeight = 22;
      doc.rect(50, rowTop, 495, rowHeight).fill(index % 2 ? "#f7f7f7" : "#ffffff");
      doc.strokeColor("#d7d7d7").rect(50, rowTop, 495, rowHeight).stroke();
      [result.parameter, result.value, result.unit || "", result.normalRange || result.referenceRange || "N/A"].forEach((value, column) => doc.fillColor("#222222").fontSize(9).font(column === 0 ? "Helvetica-Bold" : "Helvetica").text(String(value), columns[column] + 5, rowTop + 7, { width: widths[column] - 8 }));
      rowTop += rowHeight;
    });
    doc.y = rowTop + 10;

    doc.moveDown(0.5);
    doc.text(`Technician Remarks: ${report.technicianRemarks || "N/A"}`);
    doc.text(`Pathologist Remarks: ${report.pathologistRemarks || "N/A"}`);
    doc.moveDown(1);
    const pathologistName = report.pathologistId?.name || report.pathologistSignature || "Pathologist";
    const qualification = report.pathologistId?.qualification || "";
    doc.text(`Pathologist: ${pathologistName}${qualification ? ` (${qualification})` : ""}`);
    doc.text(`Signature: ${report.pathologistSignature}`);
    if (report.pathologistSignatureImage?.startsWith("data:image")) {
      try {
        const base64 = report.pathologistSignatureImage.split(",")[1];
        doc.moveDown(0.5);
        doc.image(Buffer.from(base64, "base64"), { width: 140 });
      } catch (error) {
        doc.text("Signature image unavailable");
      }
    }
    if (!hasLetterheadImage) drawDefaultFooter(doc);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Report download failed" });
  }
};

const downloadReceipt = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Receipt is available only after payment is marked as paid" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = buildPatientPdfFilename(booking.name, booking.patientCode);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    const hasLetterheadImage = drawLetterhead(doc);
    doc.x = 50;
    doc.fontSize(20).text("INDIPATH Super Speciality Lab", 50, doc.y, { width: 495, align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text("Payment Receipt", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(11);
    doc.text(`Receipt Number: ${booking.receiptNumber}`);
    doc.text(`Patient ID: ${booking.patientCode || "Pending"}`);
    doc.text(`Booking ID: ${booking.bookingCode}`);
    doc.text(`Patient Name: ${booking.name}`);
    doc.text(`Test Name: ${booking.testName}`);
    doc.text(`Booking Date: ${booking.bookingDate}`);
    doc.text(`Time Slot: ${booking.timeSlot}`);
    doc.text(`Total Amount: INR ${booking.amount}`);
    doc.text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`);
    doc.text(`Payment Date: ${booking.paidAt ? booking.paidAt.toLocaleString("en-IN") : "N/A"}`);
    doc.moveDown(1);
    doc.text("Payment received successfully. Thank you for choosing INDIPATH.");
    if (!hasLetterheadImage) drawDefaultFooter(doc);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Receipt download failed" });
  }
};

module.exports = { getTests, getPackages, createBooking, getBookings, getReports, downloadReport, downloadReceipt };
