const User = require("../models/User");
const Test = require("../models/Test");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const bcrypt = require("bcryptjs");
const { normalizeRole } = require("./authController");
const { sendEmail } = require("../config/email");
const { writeAuditLog } = require("../utils/auditLogger");

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
      Booking.aggregate([
        { $match: { paymentStatus: "Unpaid", bookingStatus: { $nin: ["Rejected", "Cancelled"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Booking.find()
        .select("bookingCode name testName bookingDate bookingStatus paymentStatus amount")
        .sort({ updatedAt: -1 })
        .limit(6),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

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
        pendingAmount: pendingAmount[0]?.total || 0
      },
      roleBreakdown,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard metrics", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, mobile, role, qualification } = req.body;
    const userPhone = phone || mobile;
    const userRole = normalizeRole(role);

    if (!name || !email || !password || !userPhone || !role) {
      return res.status(400).json({ message: "Name, email, phone, password and role are required" });
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
      qualification: userRole === "pathologist" ? qualification : undefined,
      password: await bcrypt.hash(password, 10),
      role: userRole,
      isVerified: true,
      mustChangePassword: ["receptionist", "technician", "pathologist"].includes(userRole)
    });

    if (["receptionist", "technician", "pathologist"].includes(user.role)) {
      await sendEmail({
        to: user.email,
        subject: `Your INDIPATH ${user.role} account is created`,
        text: [
          `Your ${user.role} account is created.`,
          "",
          `Email: ${user.email}`,
          "Please login and change your temporary password."
        ].join("\n")
      });
    }

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

module.exports = { getDashboardMetrics, createUser, getUsers, deleteUser, addTest, getTests, updateTest, deleteTest };
