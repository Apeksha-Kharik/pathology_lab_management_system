const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");
const { reviewResults } = require('./resultReviewService');
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

const formatDateTime = (value) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value)) + ' IST' : 'Not recorded';

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const drawLetterhead = (doc) => {
  if (fs.existsSync(letterheadImagePath)) {
    doc.image(letterheadImagePath, 0, 0, {
      cover: [doc.page.width, doc.page.height],
      align: "center",
      valign: "center"
    });
    // Remove only the vertical decorative text; retain the supplied logo/footer.
    doc.rect(doc.page.width - 35, 300, 35, 330).fill('#ffffff');
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

// Shared receipt/report layout stays inside the supplied letterhead's white area.
const theme = { left: 36, width: 524, top: 147, bottom: 684, ink: "#172b4d", muted: "#64748b", green: "#187b4b", line: "#d9e2e8" };
const printable = value => String(value ?? "").replace(/[\u2013\u2014]/g, "-");
const font = (doc, bold = false) => doc.font(bold ? "BodyBold" : "Body");
const write = (doc, value, x, y, width, options = {}) => font(doc, options.bold).fillColor(options.color || theme.ink).fontSize(options.size || 10).text(printable(value), x, y, { width, lineGap: 2, ...options });
const textHeight = (doc, value, width, bold = false, size = 10) => font(doc, bold).fontSize(size).heightOfString(printable(value), { width, lineGap: 2 });
const createDocument = (output, title, identifier, status = '') => {
  const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: theme.left, right: 50 }, bufferPages: true });
  const regular = ["C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"].find(file => fs.existsSync(file));
  const bold = ["C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"].find(file => fs.existsSync(file));
  doc.registerFont("Body", regular || "Helvetica");
  doc.registerFont("BodyBold", bold || "Helvetica-Bold");
  doc.on("error", error => output.destroy(error));
  doc.pipe(output);
  let pageNumber = 0;
  const header = () => {
    pageNumber++;
    drawLetterhead(doc);
    write(doc, title, theme.left, 100, theme.width, { bold: true, size: 15, align: "center" });
    write(doc, identifier || "", theme.left, 123, theme.width, { size: 9, color: theme.muted, align: "center" });
    doc.moveTo(theme.left, 139).lineTo(theme.left + theme.width, 139).lineWidth(0.8).strokeColor(theme.green).stroke();
    doc.x = theme.left;
    doc.y = theme.top;
    if (status && (pageNumber === 1 || status !== 'Approved')) {
      const approved = status === 'Approved';
      doc.rect(theme.left, 147, theme.width, 27).fill(approved ? '#edf5f1' : '#fff0d9');
      const label = approved ? 'FINAL REPORT - PATHOLOGIST APPROVED' : status === 'Rejected' ? 'CORRECTION REQUIRED - NOT A FINAL REPORT' : 'AWAITING APPROVAL - PRELIMINARY, NOT A FINAL REPORT';
      write(doc, label, theme.left + 8, 155, theme.width - 16, { bold: true, size: 10, color: approved ? theme.green : '#854d0e', align: 'center' });
      doc.y = 184;
    }
  };
  header();
  doc.on("pageAdded", header);
  return doc;
};
const ensureSpace = (doc, height) => { if (doc.y + height > theme.bottom) doc.addPage(); };
const section = (doc, title) => {
  ensureSpace(doc, 36);
  const y = doc.y;
  doc.rect(theme.left, y, theme.width, 22).fill("#edf5f1");
  write(doc, title, theme.left + 9, y + 6, theme.width - 18, { bold: true, size: 9, color: theme.green });
  doc.y = y + 30;
};
const details = (doc, rows, columns = 1) => {
  if (columns === 2) {
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2);
      const height = Math.max(32, ...pair.map(([, value]) => textHeight(doc, value || "N/A", 236) + 18));
      ensureSpace(doc, height);
      const y = doc.y;
      pair.forEach(([label, value], column) => {
        const x = theme.left + column * 258;
        write(doc, label.toUpperCase(), x, y, 236, { size: 8, color: theme.muted });
        write(doc, value || "N/A", x, y + 13, 236, { bold: true });
      });
      doc.y = y + height;
    }
    doc.y += 6;
    return;
  }
  for (const [label, value] of rows) {
    const height = Math.max(21, textHeight(doc, value || "N/A", 376) + 9);
    ensureSpace(doc, height);
    const y = doc.y;
    write(doc, label, theme.left, y, 112, { size: 8, color: theme.muted });
    write(doc, value || "N/A", theme.left + 120, y, 380);
    doc.y = y + height;
  }
  doc.y += 8;
};
const paragraph = (doc, label, value) => {
  if (!value) return;
  section(doc, label);
  // Split lengthy notes into paragraphs that can continue on subsequent pages.
  for (const line of printable(value).split("\n")) {
    const words = line.split(/\s+/);
    let chunk = "";
    for (const word of words) {
      const next = chunk ? `${chunk} ${word}` : word;
      if (textHeight(doc, next, theme.width) > 100 && chunk) {
        const height = textHeight(doc, chunk, theme.width);
        ensureSpace(doc, height + 8);
        const y = doc.y;
        write(doc, chunk, theme.left, y, theme.width);
        doc.y = y + height + 8;
        chunk = word;
      } else chunk = next;
    }
    const height = textHeight(doc, chunk, theme.width);
    ensureSpace(doc, height + 8);
    const y = doc.y;
    write(doc, chunk, theme.left, y, theme.width);
    doc.y = y + height + 8;
  }
};
const table = (doc, headings, widths, rows, trailingSpace = 0) => {
  let currentSection = '';
  const drawGroup = title => {
    const y = doc.y;
    doc.rect(theme.left, y, theme.width, 18).fill('#edf5f1');
    write(doc, title, theme.left + 8, y + 3, theme.width - 16, { bold: true, size: 10, color: theme.green });
    doc.y = y + 18;
  };
  const drawHeader = () => {
    const y = doc.y;
    doc.rect(theme.left, y, theme.width, 25).fill(theme.green);
    let x = theme.left;
    headings.forEach((heading, i) => { write(doc, heading, x + 8, y + 8, widths[i] - 16, { bold: true, size: 8, color: "#ffffff" }); x += widths[i]; });
    doc.y = y + 25;
  };
  ensureSpace(doc, 60);
  drawHeader();
  rows.forEach((cells, index) => {
    if (cells.section) {
      const next = rows[index + 1];
      const nextHeight = next && !next.section ? Math.max(32, ...next.map((value, i) => textHeight(doc, value, widths[i] - 16, i === 0, 11) + 16)) : 32;
      const reserve = index === rows.length - 2 ? trailingSpace : 0;
      if (doc.y + 18 + nextHeight + reserve > theme.bottom) { doc.addPage(); drawHeader(); }
      currentSection = cells.section;
      drawGroup(currentSection);
      return;
    }
    const height = Math.max(32, ...cells.map((value, i) => textHeight(doc, value, widths[i] - 16, i === 0, 11) + 16));
    const reserve = index === rows.length - 1 ? trailingSpace : 0;
    if (doc.y + height + reserve > theme.bottom) { doc.addPage(); drawHeader(); if (currentSection) drawGroup(`${currentSection} (continued)`); }
    const y = doc.y;
    doc.rect(theme.left, y, theme.width, height).fill(index % 2 ? "#f4f7f8" : "#ffffff");
    let x = theme.left;
    cells.forEach((value, i) => { write(doc, value, x + 8, y + 8, widths[i] - 16, { size: 11, bold: i === 0 || (i === 1 && cells.abnormal), color: i === 1 && cells.abnormal ? '#b42318' : theme.ink }); x += widths[i]; });
    doc.moveTo(theme.left, y + height).lineTo(theme.left + theme.width, y + height).lineWidth(0.4).strokeColor(theme.line).stroke();
    doc.y = y + height;
  });
  doc.y += 8;
};
const finishDocument = doc => {
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    write(doc, `Page ${i + 1} of ${pages.count}`, theme.left, 691, theme.width, { size: 7, color: theme.muted, align: "right" });
  }
  doc.end();
};
const renderReportPdf = (report, patient = {}, output) => {
  const booking = report.bookingId || {};
  const doc = createDocument(output, "DIAGNOSTIC TEST REPORT", `Report: ${report.reportId || "N/A"}   |   Booking: ${booking.bookingCode || "N/A"}`, report.status);
  const review = reviewResults(report.results || [], booking.gender || patient.gender);
  const metadata = [
    ['Patient name', booking.name || patient.name || 'N/A'],
    ['Age / Gender', `${booking.age ?? patient.age ?? 'N/A'} / ${booking.gender || patient.gender || 'N/A'}`],
    ['Patient ID', booking.patientCode || 'Pending'], ['Phone', booking.phone || patient.phone || 'N/A'],
    ['Sample ID', booking.sampleId || 'N/A'], ['Collected', formatDateTime(booking.sampleCollectedAt)],
    [report.status === 'Approved' ? 'Approved' : 'Submitted', formatDateTime(report.status === 'Approved' ? report.approvedAt : report.submittedAt)],
    ['Generated', formatDateTime(new Date())]
  ];
  for (let i = 0; i < metadata.length; i += 2) {
    const pair = metadata.slice(i, i + 2);
    const height = Math.max(21, ...pair.map(([, value]) => textHeight(doc, value, 172, true, 10) + 8));
    ensureSpace(doc, height);
    const y = doc.y;
    pair.forEach(([label, value], column) => {
      const x = theme.left + column * 266;
      write(doc, label, x, y, 82, { size: 9, color: theme.muted });
      write(doc, value, x + 86, y, 172, { size: 10, bold: true });
    });
    doc.y = y + height;
  }
  doc.y += 2;
  const testHeight = textHeight(doc, report.testName || 'Test results', theme.width, true, 12);
  ensureSpace(doc, testHeight + 12);
  const testY = doc.y;
  write(doc, report.testName || 'Test results', theme.left, testY, theme.width, { size: 12, bold: true, color: theme.green });
  doc.y = testY + testHeight + 9;
  if (report.reportLetterhead) paragraph(doc, 'LABORATORY', report.reportLetterhead);
  if (report.reportDescription) {
    const height = textHeight(doc, report.reportDescription, theme.width, false, 10);
    ensureSpace(doc, height + 10);
    const y = doc.y;
    write(doc, report.reportDescription, theme.left, y, theme.width, { size: 10, color: theme.muted });
    doc.y = y + height + 10;
  }
  const resultGroups = new Map();
  for (const result of review.rows) {
    const separator = String(result.parameter || '').indexOf(' - ');
    const group = separator > 0 ? result.parameter.slice(0, separator) : 'Test results';
    const parameter = separator > 0 ? result.parameter.slice(separator + 3) : result.parameter;
    if (!resultGroups.has(group)) resultGroups.set(group, []);
    const flag = ({ Low: 'L', High: 'H', Critical: 'CRITICAL', Abnormal: 'ABN' })[result.status];
    const cells = [parameter || 'N/A', `${result.value ?? 'N/A'}${flag ? ` [${flag}]` : ''}`, result.unit || '-', result.normalRange || result.referenceRange || 'Not configured'];
    cells.abnormal = Boolean(flag);
    resultGroups.get(group).push(cells);
  }
  const groupedRows = [];
  for (const [name, rows] of resultGroups) {
    if (name !== 'Test results') groupedRows.push({ section: name });
    groupedRows.push(...rows);
  }
  const signatureUrl = report.pathologistSignatureImage || report.approvedBy?.signatureUrl || '';
  const hasSignatureImage = Boolean(signatureUrl) && report.status === 'Approved';
  const signerName = report.approvedPathologistName || report.approvedBy?.name || report.pathologistSignature || 'Pathologist';
  const qualification = report.approvedPathologistQualification || report.approvedBy?.qualification || '';
  const registration = report.approvedPathologistRegistrationNumber || report.approvedBy?.registrationNumber || '';
  const notes = [
    report.technicianRemarks && ['Technician remarks', report.technicianRemarks],
    report.pathologistRemarks && ['Laboratory remarks', report.pathologistRemarks]
  ].filter(Boolean);
  const notesWidth = 292;
  const signerWidth = 212;
  const notesHeight = notes.reduce((total, [label, value]) => total + 17 + textHeight(doc, value, notesWidth, false, 11) + 9, 0);
  const signerHeight = report.status === 'Approved'
    ? (hasSignatureImage ? 56 : 8) + textHeight(doc, signerName, signerWidth, true, 12) +
      (qualification ? textHeight(doc, qualification, signerWidth, false, 10) + 4 : 0) +
      (registration ? textHeight(doc, `Reg. No. ${registration}`, signerWidth, false, 10) + 4 : 0) + 8
    : 58;
  const closingHeight = Math.max(notesHeight, signerHeight) + 8;
  const legend = 'Flags: L = Low, H = High, ABN = Abnormal; based on configured ranges or laboratory status.';
  const legendHeight = textHeight(doc, legend, theme.width, false, 9) + 10;
  const reviewHeight = review.warnings.length ? 30 + review.warnings.reduce((sum, text) => sum + textHeight(doc, text, theme.width) + 8, 0) : 0;
  // Reserve measured closing content with the last result, instead of a fixed
  // signature allowance followed by a second independent page-break decision.
  const tailHeight = 8 + legendHeight + reviewHeight + closingHeight;
  table(doc, ['TEST / PARAMETER', 'RESULT / FLAG', 'UNIT', 'REFERENCE RANGE'], [220, 80, 65, 159], groupedRows, Math.min(tailHeight, 270));
  ensureSpace(doc, legendHeight);
  const legendY = doc.y;
  write(doc, legend, theme.left, legendY, theme.width, { size: 9, color: theme.muted });
  doc.y = legendY + legendHeight;
  if (review.warnings.length) paragraph(doc, 'LABORATORY REVIEW NOTES', review.warnings.join('\n'));
  // Long narrative notes may flow before the measured authorization block.
  let closingNotes = notes;
  if (closingHeight > 250) {
    for (const [label, value] of notes) paragraph(doc, label, value);
    closingNotes = [];
  }
  ensureSpace(doc, closingNotes.length ? closingHeight : signerHeight + 12);
  const closingY = doc.y + 6;
  doc.moveTo(theme.left, closingY - 6).lineTo(theme.left + theme.width, closingY - 6).strokeColor(theme.line).lineWidth(0.6).stroke();
  let notesY = closingY;
  for (const [label, value] of closingNotes) {
    write(doc, label, theme.left, notesY, notesWidth, { size: 10, bold: true, color: theme.green });
    notesY += 17;
    write(doc, value, theme.left, notesY, notesWidth, { size: 11 });
    notesY += textHeight(doc, value, notesWidth, false, 11) + 9;
  }
  const signerX = theme.left + theme.width - signerWidth;
  let signerY = closingY;
  if (report.status !== 'Approved') {
    write(doc, 'AUTHORIZATION PENDING', signerX, signerY, signerWidth, { size: 10, bold: true, color: '#854d0e', align: 'right' });
    write(doc, 'Pathologist signature will appear after approval. Preliminary report only.', signerX, signerY + 20, signerWidth, { size: 10, align: 'right' });
  } else {
    if (hasSignatureImage) {
      try {
        const image = signatureUrl.startsWith('data:image') ? Buffer.from(signatureUrl.split(',')[1], 'base64') : path.join(__dirname, '..', 'uploads', 'signatures', path.basename(signatureUrl));
        if (Buffer.isBuffer(image) || fs.existsSync(image)) doc.image(image, signerX + 12, signerY, { fit: [190, 50], align: 'right', valign: 'center' });
      } catch { /* Preserve the saved signer identity if an image is unreadable. */ }
      signerY += 56;
    } else signerY += 8;
    write(doc, signerName, signerX, signerY, signerWidth, { size: 12, bold: true, align: 'right' });
    signerY += textHeight(doc, signerName, signerWidth, true, 12) + 4;
    if (qualification) {
      write(doc, qualification, signerX, signerY, signerWidth, { size: 10, align: 'right' });
      signerY += textHeight(doc, qualification, signerWidth, false, 10) + 4;
    }
    if (registration) {
      write(doc, `Reg. No. ${registration}`, signerX, signerY, signerWidth, { size: 10, align: 'right' });
      signerY += textHeight(doc, `Reg. No. ${registration}`, signerWidth, false, 10) + 4;
    }
  }
  finishDocument(doc);
  return buildPatientPdfFilename(booking.name || patient.name, booking.patientCode || booking.bookingCode, "RPT");
};
const renderReceiptPdf = (booking, output) => {
  const doc = createDocument(output, "PAYMENT RECEIPT", `Receipt: ${booking.receiptNumber || booking.receiptId || "N/A"}   |   Booking: ${booking.bookingCode || "N/A"}`);
  section(doc, "PATIENT DETAILS");
  details(doc, [
    ["Patient name", booking.name],
    ["Patient ID", booking.patientCode || "Pending"],
    ["Age / Gender", `${booking.age ?? "N/A"} / ${booking.gender || "N/A"}`],
    ["Phone", booking.phone],
    ["Appointment", `${booking.bookingDate || "N/A"} | ${booking.timeSlot || "N/A"}`]
  ], 2);
  section(doc, "BOOKED TESTS / PACKAGES");
  table(doc, ["DESCRIPTION", "AMOUNT"], [399, 125], [[booking.testName || "Diagnostic booking", formatCurrency(booking.amount)]]);
  ensureSpace(doc, 42);
  const totalY = doc.y;
  doc.rect(theme.left, totalY, theme.width, 34).fill("#edf5f1");
  write(doc, "TOTAL PAID", theme.left + 10, totalY + 11, 250, { bold: true, color: theme.green });
  write(doc, formatCurrency(booking.amount), theme.left + 300, totalY + 10, 190, { bold: true, size: 12, align: "right" });
  doc.y = totalY + 50;
  section(doc, "PAYMENT DETAILS");
  details(doc, [
    ["Payment status", booking.paymentStatus],
    ["Payment method", String(booking.paymentMethod || "N/A").toUpperCase()],
    ["Payment date", formatDateTime(booking.paidAt || booking.paymentDate)],
    ["Payment mode", booking.razorpayMode === "test" ? "TEST - No real money received" : "Offline / Live"]
  ]);
  ensureSpace(doc, 28);
  write(doc, booking.razorpayMode === "test" ? "Test payment recorded. No real money received." : "Payment received. Thank you for choosing INDIPATH.", theme.left, doc.y, theme.width, { size: 9, color: theme.green });
  finishDocument(doc);
  return buildPatientPdfFilename(booking.name, booking.patientCode, "RCT");
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
