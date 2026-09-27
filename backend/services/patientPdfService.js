const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");
const letterheadImagePath = path.join(__dirname, "..", "assets", "indipath-letterhead.png");
const brandLogoPath = path.join(__dirname, "..", "..", "frontend", "src", "assets", "logo.png");
const pdfLayout = {
  left: 56,
  right: 506,
  contentTop: 124,
  contentBottom: 650
};

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";

const buildPatientPdfFilename = (name, patientCode, documentType = "RPT") => {
  return `${safeFilePart(name)}-${safeFilePart(patientCode || "pending-patient-id")}-${safeFilePart(documentType).toUpperCase()}.pdf`;
};

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "N/A";

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const drawLetterhead = (doc) => {
  if (fs.existsSync(letterheadImagePath)) {
    doc.image(letterheadImagePath, 0, 0, {
      cover: [doc.page.width, doc.page.height],
      align: "center",
      valign: "center"
    });
    doc.y = pdfLayout.contentTop;
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

const drawTitleBlock = (doc, title, subtitle) => {
  const top = doc.y;
  doc.roundedRect(pdfLayout.left, top, pdfLayout.right - pdfLayout.left, 38, 4).fill("#173b8f");
  doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text(title, pdfLayout.left + 10, top + 10, { width: 430, align: "center" });
  if (subtitle) {
    doc.fillColor("#dff7ea").fontSize(7.5).font("Helvetica-Bold").text(subtitle, pdfLayout.left + 10, top + 28, { width: 430, align: "center" });
  }
  doc.y = top + 52;
};

const drawInfoGrid = (doc, title, rows, startY = doc.y) => {
  const width = pdfLayout.right - pdfLayout.left;
  const left = pdfLayout.left;
  const rowHeight = 22;
  const headerHeight = 22;
  const bodyHeight = Math.ceil(rows.length / 2) * rowHeight;

  doc.roundedRect(left, startY, width, headerHeight + bodyHeight + 10, 5).fill("#ffffff").strokeColor("#cfe4d8").stroke();
  doc.rect(left, startY, width, headerHeight).fill("#187b4b");
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold").text(title, left + 12, startY + 7);

  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column ? 284 : left + 12;
    const y = startY + headerHeight + 11 + (row * rowHeight);
    doc.fillColor("#173b8f").fontSize(7.5).font("Helvetica-Bold").text(label.toUpperCase(), x, y, { width: 82 });
    doc.fillColor("#1f2937").fontSize(8.8).font("Helvetica").text(String(value || "N/A"), x + 86, y, { width: 128, height: 18, ellipsis: true });
  });

  doc.y = startY + headerHeight + bodyHeight + 24;
};

const drawReceiptBox = (doc, rows) => {
  const left = 80;
  const top = doc.y;
  const width = 395;
  const rowHeight = 28;

  doc.roundedRect(left, top, width, (rows.length * rowHeight) + 20, 6).fill("#ffffff").strokeColor("#cfe4d8").stroke();
  rows.forEach(([label, value], index) => {
    const y = top + 12 + (index * rowHeight);
    if (index) doc.moveTo(left + 16, y - 7).lineTo(left + width - 16, y - 7).strokeColor("#edf7f1").stroke();
    doc.fillColor("#64748b").fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), left + 20, y, { width: 140 });
    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text(String(value || "N/A"), left + 180, y - 1, { width: 200, align: "right" });
  });
  doc.y = top + (rows.length * rowHeight) + 36;
};

const drawDefaultFooter = (doc) => {
  doc.fillColor("#123a82").fontSize(9).text("INDIPATH Super Speciality Pathology Lab, 22 Mahapurush Complex, BazarPeth Kankavali, Tal. Kankavali - 416 602", 45, doc.page.height - 52, { width: 510, align: "center" });
  doc.text("02367-231970, 7448231970  |  indipathlab@gmail.com", { align: "center" });
};

const renderReportPdf = (report, patient = {}, output) => {
    const booking = report.bookingId || {};
    const results = Array.isArray(report.results) ? report.results : [];
    const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: true });
    const filename = buildPatientPdfFilename(booking.name || patient.name, booking.patientCode || booking.bookingCode, "RPT");


    doc.on("error", error => output.destroy(error));
    doc.pipe(output);
    const hasLetterheadImage = drawLetterhead(doc);
    doc.on("pageAdded", () => drawLetterhead(doc));
    doc.x = 50;
    drawTitleBlock(doc, "DIAGNOSTIC TEST REPORT", "Approved pathology report");
    const infoTop = doc.y;
    const patientDetails = [
      ["Patient Name", booking.name || patient.name], ["Age / Gender", `${booking.age || patient.age || "N/A"} / ${booking.gender || patient.gender || "N/A"}`],
      ["Phone", booking.phone || patient.phone], ["Patient ID", booking.patientCode || "Pending"],
      ["Booking ID", booking.bookingCode || "N/A"], ["Test", report.testName]
    ];
    drawInfoGrid(doc, "PATIENT & TEST INFORMATION", patientDetails, infoTop);
    const approvalLineTop = doc.y;
    doc.fillColor("#173b8f").fontSize(8).font("Helvetica-Bold").text("Approved Date & Time:", 60, approvalLineTop);
    doc.fillColor("#1f2937").font("Helvetica").text(formatDateTime(report.approvedAt), 158, approvalLineTop, { width: 220 });
    doc.y = approvalLineTop + 18;
    if (report.reportDescription) {
      doc.roundedRect(50, doc.y, 455, 34, 5).fill("#f8fffb").strokeColor("#d9efe2").stroke();
      doc.fontSize(8.5).fillColor("#334155").font("Helvetica").text(report.reportDescription, 62, doc.y + 9, { width: 431, height: 18, ellipsis: true });
      doc.y += 46;
    }
    const tableTop = doc.y + 5;
    const columns = [50, 215, 315, 390];
    const widths = [165, 100, 75, 115];
    doc.rect(50, tableTop, 455, 19).fill("#187b4b");
    ["PARAMETER", "RESULT", "UNIT", "REFERENCE RANGE"].forEach((heading, index) => doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(heading, columns[index] + 5, tableTop + 6, { width: widths[index] - 8 }));
    let rowTop = tableTop + 19;
    results.forEach((result, index) => {
      const rowHeight = 22;
      if (rowTop > pdfLayout.contentBottom - 40) {
        doc.addPage();
        rowTop = pdfLayout.contentTop;
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

    if (doc.y > pdfLayout.contentBottom - 110) doc.addPage();
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

    const signatureTop = Math.min(pdfLayout.contentBottom - 62, doc.y + 76);
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
    return filename;
};
const renderReceiptPdf = (booking, output) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const filename = buildPatientPdfFilename(booking.name, booking.patientCode, "RCT");


    doc.on("error", error => output.destroy(error));
    doc.pipe(output);
    const hasLetterheadImage = drawLetterhead(doc);
    doc.x = 50;
    drawTitleBlock(doc, "PAYMENT RECEIPT", "Official receipt for paid diagnostic booking");
    drawInfoGrid(doc, "PATIENT & BOOKING INFORMATION", [
      ["Patient Name", booking.name],
      ["Patient ID", booking.patientCode || "Pending"],
      ["Booking ID", booking.bookingCode],
      ["Receipt ID", booking.receiptId || booking.receiptNumber],
      ["Receipt No.", booking.receiptNumber],
      ["Test / Package", booking.testName],
      ["Appointment", `${booking.bookingDate || "N/A"} | ${booking.timeSlot || "N/A"}`]
    ]);
    drawReceiptBox(doc, [
      ["Total Amount", formatCurrency(booking.amount)],
      ["Payment Method", String(booking.paymentMethod || "N/A").toUpperCase()],
      ["Payment Mode", booking.razorpayMode === "test" ? "TEST - No real money received" : "Offline / Live"],
      ["Payment Status", booking.paymentStatus],
      ["Payment Date", formatDateTime(booking.paidAt)]
    ]);
    const acknowledgementTop = doc.y;
    doc.roundedRect(80, acknowledgementTop, 395, 46, 6).fill("#f0fdf4").strokeColor("#bbf7d0").stroke();
    doc.fillColor("#166534").fontSize(11).font("Helvetica-Bold").text("Payment received successfully.", 100, acknowledgementTop + 11, { width: 355, align: "center" });
    doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text("Thank you for choosing INDIPATH Super Speciality Pathology Lab.", 100, acknowledgementTop + 28, { width: 355, align: "center" });
    if (!hasLetterheadImage) drawDefaultFooter(doc);
    doc.end();
    return filename;
};

const collectPdf = (render) => new Promise((resolve, reject) => {
 const chunks = [];
 const output = new Writable({ write(chunk, encoding, done) { chunks.push(chunk); done(); } });
 output.on('error', reject);
 output.on('finish', () => resolve({ buffer: Buffer.concat(chunks), filename }));
 let filename;
 try { filename = render(output); } catch (error) { reject(error); }
});
const generateReceiptPdf = (booking) => {
 if (booking.paymentStatus !== 'Paid') return Promise.reject(new Error('Receipt requires paid booking'));
 return collectPdf(output => renderReceiptPdf(booking, output));
};
const generateReportPdf = (report) => {
 if (report.status !== 'Approved') return Promise.reject(new Error('Report requires pathologist approval'));
 return collectPdf(output => renderReportPdf(report, report.userId || {}, output));
};
module.exports = { renderReportPdf, renderReceiptPdf, buildPatientPdfFilename, generateReceiptPdf, generateReportPdf };
