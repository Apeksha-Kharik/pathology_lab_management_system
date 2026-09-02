const User = require("../models/User");
const Test = require("../models/Test");
const Package = require("../models/Package");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { normalizeRole } = require("./authController");
const { writeAuditLog } = require("../utils/auditLogger");

const letterheadImagePath = path.join(__dirname, "..", "assets", "indipath-letterhead.png");
const pdfLayout = { left: 56, right: 506, contentTop: 124, contentBottom: 650 };

const drawLetterhead = (doc) => {
  if (fs.existsSync(letterheadImagePath)) {
    doc.image(letterheadImagePath, 0, 0, { cover: [doc.page.width, doc.page.height], align: "center", valign: "center" });
    doc.y = pdfLayout.contentTop;
    return true;
  }
  doc.y = 72;
  return false;
};

const safeFilePart = (value) => String(value || "patient").trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "patient";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "N/A";

const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalTests,
      totalBookings,
      totalReports,
      patientCount,
      staffCount,
      pendingBookings,
      todaysBookings,
      pendingPayments,
      processingSamples,
      pendingReportApproval,
      readyReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      paidRevenue,
      monthlyRevenue,
      revenueByMethod,
      pendingAmount,
      recentBookings,
      roleBreakdown
    ] = await Promise.all([
      User.countDocuments(),
      Test.countDocuments(),
      Booking.countDocuments(),
      Report.countDocuments(),
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: { $ne: "patient" } }),
      Booking.countDocuments({ bookingStatus: "Pending Approval" }),
      Booking.countDocuments({ bookingDate: today }),
      Booking.countDocuments({ paymentStatus: "Unpaid", bookingStatus: { $in: ["Confirmed", "Arrived"] } }),
      Booking.countDocuments({ bookingStatus: { $in: ["Sample Collected", "Processing"] } }),
      Booking.countDocuments({ bookingStatus: "Pending Report Approval" }),
      Booking.countDocuments({ bookingStatus: "Report Ready" }),
      Report.countDocuments({ status: { $in: ["Pending Approval", "Pending Review"] } }),
      Report.countDocuments({ status: "Approved" }),
      Report.countDocuments({ status: "Rejected" }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: "Unpaid", bookingStatus: { $nin: ["Rejected", "Cancelled"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Booking.find()
        .select("bookingCode name testName bookingDate bookingStatus paymentStatus amount receiptId receiptNumber")
        .sort({ updatedAt: -1 })
        .limit(6),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const recentReports = await Report.find({ bookingId: { $in: recentBookings.map((booking) => booking._id) } })
      .select("bookingId reportId status")
      .sort({ updatedAt: -1 });
    const reportByBooking = recentReports.reduce((acc, report) => {
      const key = String(report.bookingId);
      if (!acc[key]) acc[key] = report;
      return acc;
    }, {});

    const totalMethodRevenue = revenueByMethod.reduce((sum, item) => sum + (item.total || 0), 0);
    const normalizedMethodRevenue = ["cash", "upi", "card"].map((method) => {
      const found = revenueByMethod.find((item) => item._id === method);
      const total = found?.total || 0;
      return {
        method,
        total,
        count: found?.count || 0,
        percent: totalMethodRevenue ? Number(((total / totalMethodRevenue) * 100).toFixed(1)) : 0
      };
    });

    res.json({
      totals: {
        users: totalUsers,
        tests: totalTests,
        bookings: totalBookings,
        reports: totalReports,
        patients: patientCount,
        staff: staffCount
      },
      workflow: {
        pendingBookings,
        todaysBookings,
        pendingPayments,
        processingSamples,
        pendingReportApproval,
        readyReports
      },
      reports: {
        pending: pendingReports,
        approved: approvedReports,
        rejected: rejectedReports
      },
      finance: {
        paidRevenue: paidRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
        revenueByMethod: normalizedMethodRevenue
      },
      roleBreakdown,
      recentBookings: recentBookings.map((booking) => {
        const bookingData = booking.toObject();
        const report = reportByBooking[String(booking._id)];
        return {
          ...bookingData,
          report: report ? { _id: report._id, reportId: report.reportId, status: report.status } : null,
          hasReceipt: booking.paymentStatus === "Paid" && Boolean(booking.receiptId || booking.receiptNumber)
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard metrics", error: error.message });
  }
};

const downloadAdminReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate("bookingId")
      .populate("approvedBy", "name qualification registrationNumber signatureUrl");

    if (!report || report.status !== "Approved") {
      return res.status(404).json({ message: "Approved report not found" });
    }

    const booking = report.bookingId || {};
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const filename = `${safeFilePart(booking.name)}-${safeFilePart(booking.patientCode || booking.bookingCode)}-RPT.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);
    drawLetterhead(doc);

    doc.roundedRect(pdfLayout.left, doc.y, pdfLayout.right - pdfLayout.left, 38, 4).fill("#173b8f");
    doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text("DIAGNOSTIC TEST REPORT", pdfLayout.left + 10, doc.y + 10, { width: 430, align: "center" });
    doc.y += 54;

    const details = [
      ["Patient Name", booking.name],
      ["Age / Gender", `${booking.age || "N/A"} / ${booking.gender || "N/A"}`],
      ["Patient ID", booking.patientCode || "Pending"],
      ["Booking ID", booking.bookingCode || "N/A"],
      ["Report ID", report.reportId || "N/A"],
      ["Test", report.testName],
      ["Approved", formatDateTime(report.approvedAt)]
    ];
    details.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column ? 292 : 62;
      const y = doc.y + (row * 22);
      doc.fillColor("#173b8f").fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x, y, { width: 86 });
      doc.fillColor("#1f2937").fontSize(9).font("Helvetica").text(String(value || "N/A"), x + 90, y, { width: 126, height: 18, ellipsis: true });
    });
    doc.y += 98;

    const columns = [50, 215, 315, 390];
    const widths = [165, 100, 75, 115];
    doc.rect(50, doc.y, 455, 20).fill("#187b4b");
    ["PARAMETER", "RESULT", "UNIT", "REFERENCE RANGE"].forEach((heading, index) => doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(heading, columns[index] + 5, doc.y + 6, { width: widths[index] - 8 }));
    let rowTop = doc.y + 20;
    (report.results || []).forEach((result, index) => {
      if (rowTop > pdfLayout.contentBottom - 40) {
        doc.addPage();
        drawLetterhead(doc);
        rowTop = doc.y;
      }
      doc.rect(50, rowTop, 455, 22).fill(index % 2 ? "#ffffff" : "#f8fffb");
      [result.parameter, result.value, result.unit || "", result.normalRange || result.referenceRange || ""].forEach((value, column) => {
        doc.fillColor("#1f2937").fontSize(8.5).font(column === 0 ? "Helvetica-Bold" : "Helvetica").text(String(value || "N/A"), columns[column] + 5, rowTop + 7, { width: widths[column] - 8, height: 12, ellipsis: true });
      });
      rowTop += 22;
    });
    doc.y = rowTop + 18;
    doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold").text("Pathologist Remarks:", 50, doc.y);
    doc.font("Helvetica").text(report.pathologistRemarks || "N/A", 160, doc.y - 11, { width: 345, height: 40, ellipsis: true });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Admin report download failed", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name, email, password, phone, mobile, role, qualification,
      age, gender, dateOfBirth, address, city, state, pincode,
      emergencyContactName, emergencyContactPhone, referredBy
    } = req.body;
    const userPhone = phone || mobile;
    const requestedRole = String(role || "").trim().toLowerCase();
    const creatableRoles = ["patient", "receptionist", "technician", "pathologist"];

    if (!name || !email || !password || !userPhone || !role) {
      return res.status(400).json({ message: "Name, email, phone, password and role are required" });
    }

    if (!creatableRoles.includes(requestedRole)) {
      return res.status(400).json({ message: "Role must be patient, technician, receptionist or pathologist" });
    }

    const userRole = normalizeRole(requestedRole);

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (userRole === "patient" && (!age || !address || !city)) {
      return res.status(400).json({ message: "Patient age, address and city are required" });
    }

    if (userRole === "pathologist" && !qualification) {
      return res.status(400).json({ message: "Pathologist qualification is required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      phone: userPhone,
      age: userRole === "patient" ? Number(age) : undefined,
      gender: userRole === "patient" ? gender : undefined,
      dateOfBirth: userRole === "patient" && dateOfBirth ? dateOfBirth : undefined,
      address: userRole === "patient" ? address : undefined,
      city: userRole === "patient" ? city : undefined,
      state: userRole === "patient" ? state : undefined,
      pincode: userRole === "patient" ? pincode : undefined,
      emergencyContactName: userRole === "patient" ? emergencyContactName : undefined,
      emergencyContactPhone: userRole === "patient" ? emergencyContactPhone : undefined,
      referredBy: userRole === "patient" ? referredBy : undefined,
      qualification: userRole === "pathologist" ? qualification : undefined,
      password: await bcrypt.hash(password, 10),
      role: userRole,
      isVerified: true,
      mustChangePassword: ["receptionist", "technician", "pathologist"].includes(userRole)
    });

    await writeAuditLog({
      actor: req.user,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user._id,
      details: { role: user.role, email: user.email }
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        qualification: user.qualification,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await writeAuditLog({
      actor: req.user,
      action: "USER_DELETED",
      entityType: "User",
      entityId: deletedUser._id,
      details: { role: deletedUser.role, email: deletedUser.email }
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

const buildTestPayload = (body) => ({
  testName: body.testName,
  category: body.category,
  price: Number(body.price),
  description: body.description || "",
  conditions: body.conditions || "",
  sampleType: body.sampleType || "",
  turnaroundTime: body.turnaroundTime || "",
  reportDescription: body.reportDescription || "",
  reportLetterhead: body.reportLetterhead || "",
  reportTemplate: Array.isArray(body.reportTemplate) ? body.reportTemplate.filter((row) => row.parameter) : [],
  isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
});

const addTest = async (req, res) => {
  try {
    const { testName, category, price, description, conditions } = req.body;

    if (!testName || !category || !price) {
      return res.status(400).json({ message: "Test name, category and price are required" });
    }

    const test = await Test.create(buildTestPayload(req.body));

    await writeAuditLog({
      actor: req.user,
      action: "TEST_CREATED",
      entityType: "Test",
      entityId: test._id,
      details: { testName: test.testName, price: test.price }
    });

    res.status(201).json({ message: "Test added successfully", test });
  } catch (error) {
    res.status(500).json({ message: "Error adding test" });
  }
};

const getTests = async (req, res) => {
  try {
    const tests = await Test.find();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

const updateTest = async (req, res) => {
  try {
    const { testName, category, price } = req.body;

    if (!testName || !category || !price) {
      return res.status(400).json({ message: "Test name, category and price are required" });
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      buildTestPayload(req.body),
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    await writeAuditLog({
      actor: req.user,
      action: "TEST_UPDATED",
      entityType: "Test",
      entityId: test._id,
      details: { testName: test.testName, isActive: test.isActive }
    });

    res.json({ message: "Test updated successfully", test });
  } catch (error) {
    res.status(500).json({ message: "Error updating test", error: error.message });
  }
};

const deleteTest = async (req, res) => {
  try {
    const deletedTest = await Test.findByIdAndDelete(req.params.id);
    if (!deletedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    await writeAuditLog({
      actor: req.user,
      action: "TEST_DELETED",
      entityType: "Test",
      entityId: deletedTest._id,
      details: { testName: deletedTest.testName }
    });

    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting test" });
  }
};

const normalizeTestIds = (values = []) => [...new Set(
  (Array.isArray(values) ? values : [])
    .map((value) => String(value?._id || value || "").trim())
    .filter(Boolean)
)];

const validatePackageTests = async (values) => {
  const ids = normalizeTestIds(values);
  if (!ids.length) return { error: "Select at least one active test for the package" };
  if (ids.some((id) => !mongoose.isValidObjectId(id))) return { error: "One or more selected test IDs are invalid" };
  // Older test records predate `isActive` and are active by default. Keep this
  // in sync with the admin UI, which only excludes explicitly inactive tests.
  const activeTests = await Test.find({ _id: { $in: ids }, isActive: { $ne: false } }).select("_id");
  if (activeTests.length !== ids.length) return { error: "Every selected test must exist and be active" };
  return { ids };
};

const buildPackagePayload = (body, includedTests) => {
  const status = String(body.status || (body.isActive === false ? "inactive" : "active")).toLowerCase();
  return {
    packageName: String(body.packageName || "").trim(),
    packageCode: String(body.packageCode || "").trim().toUpperCase(),
    category: body.category || "Health Checkup",
    price: Number(body.price),
    discountPrice: body.discountPrice === "" || body.discountPrice === undefined || body.discountPrice === null ? null : Number(body.discountPrice),
    description: body.description || "",
    reportDescription: body.reportDescription || "",
    reportLetterhead: body.reportLetterhead || "",
    reportTemplate: Array.isArray(body.reportTemplate) ? body.reportTemplate.filter((row) => row.parameter) : [],
    imageUrl: body.imageUrl || "",
    includedTests,
    parametersCount: includedTests.length,
    homeCollection: body.homeCollection !== false,
    status,
    isActive: status === "active"
  };
};

const validatePackagePayload = async (body) => {
  if (!String(body.packageName || "").trim() || !String(body.packageCode || "").trim() || body.price === undefined || body.price === "") return { error: "Package name, code and price are required" };
  if (!Number.isFinite(Number(body.price)) || Number(body.price) <= 0) return { error: "Package price must be a positive number" };
  if (body.discountPrice !== undefined && body.discountPrice !== "" && body.discountPrice !== null && (!Number.isFinite(Number(body.discountPrice)) || Number(body.discountPrice) < 0 || Number(body.discountPrice) >= Number(body.price))) return { error: "Discount price must be non-negative and lower than the package price" };
  if (body.status && !["active", "inactive"].includes(String(body.status).toLowerCase())) return { error: "Package status must be active or inactive" };
  return validatePackageTests(body.includedTests);
};

const getPackages = async (req, res) => {
  try {
    const packages = await Package.find().populate("includedTests", "testName category price description isActive").sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages" });
  }
};

const getPackageById = async (req, res) => {
  try {
    const packageItem = await Package.findById(req.params.id).populate("includedTests", "testName category price description isActive");
    if (!packageItem) return res.status(404).json({ message: "Package not found" });
    res.json(packageItem);
  } catch (error) {
    res.status(500).json({ message: "Error fetching package", error: error.message });
  }
};

const addPackage = async (req, res) => {
  try {
    const selection = await validatePackagePayload(req.body);
    if (selection.error) return res.status(400).json({ message: selection.error });
    const packageItem = await Package.create(buildPackagePayload(req.body, selection.ids));
    await packageItem.populate("includedTests", "testName category price description isActive");
    await writeAuditLog({ actor: req.user, action: "PACKAGE_CREATED", entityType: "Package", entityId: packageItem._id, details: { packageName: packageItem.packageName, packageCode: packageItem.packageCode, price: packageItem.price } });
    res.status(201).json({ message: "Package added successfully", package: packageItem });
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 500).json({ message: duplicate ? "Package code already exists" : "Error adding package", error: error.message });
  }
};

const deletePackage = async (req, res) => {
  try {
    const packageItem = await Package.findByIdAndDelete(req.params.id);
    if (!packageItem) return res.status(404).json({ message: "Package not found" });
    await writeAuditLog({ actor: req.user, action: "PACKAGE_DELETED", entityType: "Package", entityId: packageItem._id, details: { packageName: packageItem.packageName } });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package" });
  }
};

const updatePackage = async (req, res) => {
  try {
    const selection = await validatePackagePayload(req.body);
    if (selection.error) return res.status(400).json({ message: selection.error });
    const packageItem = await Package.findByIdAndUpdate(req.params.id, buildPackagePayload(req.body, selection.ids), { new: true, runValidators: true }).populate("includedTests", "testName category price description isActive");
    if (!packageItem) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package updated successfully", package: packageItem });
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 500).json({ message: duplicate ? "Package code already exists" : "Error updating package", error: error.message });
  }
};

module.exports = { getDashboardMetrics, downloadAdminReport, createUser, getUsers, deleteUser, addTest, getTests, updateTest, deleteTest, getPackages, getPackageById, addPackage, deletePackage, updatePackage };
