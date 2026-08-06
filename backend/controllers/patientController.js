const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Test = require("../models/Test");
const Package = require("../models/Package");

const letterheadImagePath = path.join(__dirname, "..", "assets", "indipath-letterhead.png");
const brandLogoPath = path.join(__dirname, "..", "..", "frontend", "src", "assets", "logo.png");

const drawLetterhead = (doc) => {
  if (fs.existsSync(letterheadImagePath)) {
    doc.image(letterheadImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.y = 120;
    return true;
  }

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const greenHeader = doc.linearGradient(0, 6, 0, 72);
  greenHeader.stop(0, "#16883c").stop(0.48, "#9bd49e").stop(1, "#ffffff");
  doc.rect(7, 6, pageWidth - 14, 68).fill(greenHeader);
  doc.lineWidth(0.6).strokeColor("#9a9a9a").rect(4, 4, pageWidth - 8, pageHeight - 8).stroke();

  if (fs.existsSync(brandLogoPath)) {
    doc.image(brandLogoPath, 48, 20, { fit: [35, 35] });
  }
  doc.fillColor("#ed1c24").fontSize(20).font("Helvetica-Bold").text("INDI", 86, 22, { continued: true });
  doc.fillColor("#173b8f").text("PATH", { continued: true });
  doc.fillColor("#f39a20").text(">", { continued: true });
  doc.fillColor("#42a641").text(">");
  doc.fillColor("#173b8f").fontSize(7.5).font("Helvetica-Bold").text("SUPER SPECIALITY PATHOLOGY LAB", 87, 44);

  doc.fillColor("#a8782b").fontSize(6.5).font("Helvetica-Bold");
  "TEST REPORT".split("").forEach((letter, index) => doc.text(letter, pageWidth - 27, 370 + (index * 9), { width: 10, align: "center" }));

  // Keep every footer line above PDFKit's bottom margin. Text below that limit
  // silently creates another page and separates the report from its letterhead.
  const footerTop = pageHeight - 96;
  [[footerTop, "P"], [footerTop + 9, "E"], [footerTop + 18, "A"]].forEach(([y, label]) => {
    doc.roundedRect(48, y - 1, 8, 8, 1).fill("#ef7d00");
    doc.fillColor("#ffffff").fontSize(5).font("Helvetica-Bold").text(label, 49, y + 1, { width: 6, align: "center" });
  });
  doc.fillColor("#173b8f").fontSize(6.5).font("Helvetica-Bold")
    .text("02367-231970, 7448231970", 60, footerTop)
    .text("indipathlab@gmail.com", 60, footerTop + 9);
  doc.fillColor("#db5b24").fontSize(5.5).font("Helvetica")
    .text("Indipath Super Speciality Pathology Lab, 22 Mahapurush Complex,", 60, footerTop + 18)
    .text("Bazarpeth Kankavali, Tal. Kankavali - 416 602", 60, footerTop + 26);
  doc.fillColor("#173b8f").fontSize(6).font("Helvetica-Bold")
    .text("For INDIPATH MULTIDIAGNOSTIC (I) L.L.P.", 350, footerTop - 22, { width: 160, align: "center" })
    .text("Authorised Signatory", 382, footerTop + 15, { width: 128, align: "center" });
  doc.fillColor("#111111");
  doc.y = 105;
  return true;
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
      testId, packageId, bookingDate, timeSlot, notes, age, gender, sampleType,
      name, phone, email, prescribedBy, collectionType, address, homeSample
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

    const patientName = String(name || req.user.name || "").trim();
    const patientPhone = String(phone || req.user.phone || "").trim();
    const patientEmail = String(email || req.user.email || "").trim();
    const patientAge = Number(age || req.user.age || 0);
    if (!patientName || !patientPhone || !Number.isFinite(patientAge) || patientAge <= 0) {
      return res.status(400).json({ message: "Valid patient name, phone and age are required" });
    }

    const bookingCode = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
    const booking = await Booking.create({
      userId: req.user._id,
      patientId: req.user._id,
      testId: bookingType === "Test" ? selectedItem._id : undefined,
      packageId: bookingType === "Package" ? selectedItem._id : undefined,
      bookingType,
      name: patientName,
      phone: patientPhone,
      email: patientEmail,
      age: patientAge,
      gender: gender || req.user.gender || "",
      date: bookingDate,
      bookingDate,
      timeSlot,
      notes,
      prescribedBy: prescribedBy || "",
      collectionType: collectionType === "Home Collection" ? "Home Collection" : "Visit Lab",
      address: address || "",
      sampleType: sampleType || "",
      homeSample: Boolean(homeSample),
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
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking history" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id, status: "Approved" }).sort({ approvedAt: -1 });
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
    }).populate("bookingId").populate("approvedBy", "name qualification registrationNumber signatureUrl");

    if (!report) {
      return res.status(404).json({ message: "Report not found or not ready" });
    }

    const booking = report.bookingId || {};
    const results = Array.isArray(report.results) ? report.results : [];
    const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: true });
    const filename = `report-${booking.bookingCode || report._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);
    const hasLetterheadImage = drawLetterhead(doc);
    doc.on("pageAdded", () => drawLetterhead(doc));
    doc.x = 50;
    doc.fillColor("#173b8f").fontSize(16).font("Helvetica-Bold").text("DIAGNOSTIC REPORT", 50, doc.y, { width: 455, align: "center" });
    const infoTop = doc.y + 12;
    const patientDetails = [
      ["Patient Name", booking.name || req.user.name], ["Age / Gender", `${booking.age || req.user.age || "N/A"} / ${booking.gender || req.user.gender || "N/A"}`],
      ["Phone", booking.phone || req.user.phone], ["Booking ID", booking.bookingCode || "N/A"],
      ["Test", report.testName]
    ];
    doc.rect(50, infoTop, 455, 18).fill("#187b4b");
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("PATIENT & TEST INFORMATION", 60, infoTop + 5);
    patientDetails.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column ? 290 : 60;
      const y = infoTop + 28 + (row * 18);
      doc.fillColor("#333333").fontSize(8).font("Helvetica-Bold").text(`${label}:`, x, y);
      doc.font("Helvetica").text(String(value || "N/A"), x + 76, y, { width: 145 });
    });
    const approvalTop = infoTop + 84;
    doc.fillColor("#333333").fontSize(8).font("Helvetica-Bold").text("Approved Date & Time:", 60, approvalTop);
    doc.font("Helvetica").text(report.approvedAt ? report.approvedAt.toLocaleString("en-IN") : "N/A", 150, approvalTop, { width: 250 });
    doc.y = approvalTop + 20;
    if (report.reportDescription) {
      doc.fontSize(9).fillColor("#444444").text(report.reportDescription, 50, doc.y, { width: 470, align: "left" });
      doc.moveDown(1);
    }
    const tableTop = doc.y + 5;
    const columns = [50, 215, 315, 390];
    const widths = [165, 100, 75, 115];
    doc.rect(50, tableTop, 455, 19).fill("#187b4b");
    ["PARAMETER", "RESULT", "UNIT", "REFERENCE RANGE"].forEach((heading, index) => doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(heading, columns[index] + 5, tableTop + 6, { width: widths[index] - 8 }));
    let rowTop = tableTop + 19;
    results.forEach((result, index) => {
      const rowHeight = 22;
      if (rowTop > doc.page.height - 235) {
        doc.addPage();
        rowTop = doc.y;
        doc.rect(50, rowTop, 455, 19).fill("#187b4b");
        ["PARAMETER", "RESULT", "UNIT", "REFERENCE RANGE"].forEach((heading, column) => doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(heading, columns[column] + 5, rowTop + 6, { width: widths[column] - 8 }));
        rowTop += 19;
      }
      doc.rect(50, rowTop, 455, rowHeight).fill(index % 2 ? "#f2faf5" : "#ffffff");
      doc.strokeColor("#cfe4d8").rect(50, rowTop, 455, rowHeight).stroke();
      [result?.parameter || "N/A", result?.value ?? "N/A", result?.unit || "", result?.normalRange || result?.referenceRange || "N/A"].forEach((value, column) => doc.fillColor("#222222").fontSize(9).font(column === 0 ? "Helvetica-Bold" : "Helvetica").text(String(value), columns[column] + 5, rowTop + 7, { width: widths[column] - 8 }));
      rowTop += rowHeight;
    });
    doc.y = rowTop + 10;

    if (doc.y > doc.page.height - 300) doc.addPage();
    const remarksTop = doc.y + 6;
    doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold").text("Technician Remarks:", 50, remarksTop, { width: 125 });
    doc.font("Helvetica").text(report.technicianRemarks || "N/A", 155, remarksTop, { width: 350, height: 18, ellipsis: true });
    doc.font("Helvetica-Bold").text("Pathologist Remarks:", 50, remarksTop + 24, { width: 125 });
    doc.font("Helvetica").text(report.pathologistRemarks || "N/A", 155, remarksTop + 24, { width: 350, height: 60, ellipsis: true });
    const pathologistName = report.approvedPathologistName || report.approvedBy?.name || report.pathologistSignature || "Pathologist";
    const signatureUrl = report.pathologistSignatureImage || report.approvedBy?.signatureUrl || "";
    const isLegacyDataImage = signatureUrl.startsWith("data:image");
    const signatureFilename = isLegacyDataImage ? "" : path.basename(signatureUrl);
    const signaturePath = signatureFilename ? path.join(__dirname, "..", "uploads", "signatures", signatureFilename) : "";

    const signatureTop = doc.page.height - 205;
    if ((signatureFilename && fs.existsSync(signaturePath)) || isLegacyDataImage) {
      try {
        const signatureImage = isLegacyDataImage ? Buffer.from(signatureUrl.split(",")[1], "base64") : signaturePath;
        doc.image(signatureImage, 370, signatureTop, { fit: [120, 48], align: "center", valign: "center" });
      } catch (error) {
        doc.fillColor("#666666").fontSize(8).text("Signature image unavailable", 370, signatureTop + 18, { width: 120, align: "center" });
      }
    }
    const qualification = report.approvedPathologistQualification || report.approvedBy?.qualification || "";
    const registrationNumber = report.approvedPathologistRegistrationNumber || report.approvedBy?.registrationNumber || "";
    doc.fillColor("#173b8f").fontSize(9).font("Helvetica-Bold").text(pathologistName, 350, signatureTop + 50, { width: 160, align: "center" });
    doc.fontSize(7).font("Helvetica").text([qualification, registrationNumber && `Reg. No. ${registrationNumber}`].filter(Boolean).join(" | "), 350, signatureTop + 62, { width: 160, align: "center" });
    doc.y = signatureTop + 76;
    if (!hasLetterheadImage) drawDefaultFooter(doc);
    doc.end();
  } catch (error) {
    console.error("Report PDF generation failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Report download failed" });
    } else {
      res.end();
    }
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
    const filename = `receipt-${booking.bookingCode || booking._id}.pdf`;

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
