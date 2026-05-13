const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOtpEmail } = require("../config/email");

const allowedRoles = ["admin", "patient", "receptionist", "technician", "pathologist"];

const normalizeRole = (role) => {
  const normalizedRole = String(role || "patient").toLowerCase();
  return allowedRoles.includes(normalizedRole) ? normalizedRole : "patient";
};

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: normalizeRole(user.role) },
    process.env.JWT_SECRET || "dev_pathology_secret",
    { expiresIn: "1d" }
  );
};

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || user.get("mobile") || "",
  role: normalizeRole(user.role),
  isVerified: user.isVerified
});

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getOtpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

const register = async (req, res) => {
  try {
    const { name, email, password, phone, mobile } = req.body;
    const userPhone = phone || mobile;

    if (!name || !email || !password || !userPhone) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const user = await User.create({
      name,
      email,
      phone: userPhone,
      password: hashedPassword,
      role: "patient",
      isVerified: false,
      otp,
      otpExpiry: getOtpExpiry()
    });

    const emailResult = await sendOtpEmail({
      to: user.email,
      subject: "Verify your INDIPATH account",
      otp
    });

    res.status(201).json({
      message: "Registration successful. OTP sent to your email.",
      user: buildUserResponse(user),
      devOtp: emailResult.devOtp
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isHashedPassword = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
    const passwordMatches = isHashedPassword
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Please verify your email before login" });
    }

    if (!isHashedPassword) {
      user.password = await bcrypt.hash(password, 10);
      user.role = normalizeRole(user.role);
      user.phone = user.phone || user.get("mobile") || "Not provided";
      await user.save();
    }

    res.json({
      message: "Login successful",
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = getOtpExpiry();
    user.resetPasswordVerified = false;
    user.resetPasswordExpiry = undefined;
    await user.save();

    const emailResult = await sendOtpEmail({
      to: user.email,
      subject: "Reset your INDIPATH password",
      otp
    });

    res.json({
      message: "Password reset OTP sent to your email",
      devOtp: emailResult.devOtp
    });
  } catch (error) {
    res.status(500).json({ message: "Forgot password failed", error: error.message });
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.resetPasswordVerified = true;
    user.resetPasswordExpiry = getOtpExpiry();
    await user.save();

    res.json({ message: "OTP verified. You can reset your password now." });
  } catch (error) {
    res.status(500).json({ message: "Reset OTP verification failed", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetPasswordVerified || !user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ message: "Please verify reset OTP again" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.resetPasswordVerified = false;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};

module.exports = { register, verifyOtp, login, forgotPassword, verifyResetOtp, resetPassword, normalizeRole };
