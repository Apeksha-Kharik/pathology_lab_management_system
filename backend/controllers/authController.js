const bcrypt = require("bcryptjs");
const { randomInt } = require("crypto");
const pendingRegistrations = require("../services/pendingRegistrations");
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
  age: user.age || "",
  gender: user.gender || "",
  dateOfBirth: user.dateOfBirth || "",
  address: user.address || "",
  city: user.city || "",
  state: user.state || "",
  pincode: user.pincode || "",
  emergencyContactName: user.emergencyContactName || "",
  emergencyContactPhone: user.emergencyContactPhone || "",
  referredBy: user.referredBy || "",
  qualification: user.qualification || "",
  registrationNumber: user.registrationNumber || "",
  signatureUrl: user.signatureUrl || "",
  role: normalizeRole(user.role),
  isVerified: user.isVerified,
  mustChangePassword: user.mustChangePassword
});

const generateOtp = () => String(randomInt(100000, 1000000));

const getOtpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

const canExposeDevOtp = () =>
  process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_OTP !== "false";


const getPasswordValidationErrors = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password || "")) {
    errors.push("Password must include at least one uppercase character");
  }

  if (!/[a-z]/.test(password || "")) {
    errors.push("Password must include at least one lowercase character");
  }

  if (!/\d/.test(password || "")) {
    errors.push("Password must include at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password || "")) {
    errors.push("Password must include at least one special character");
  }

  return errors;
};

const register = async (req, res) => {
  let registrationId;
  try {
    const { name, email, password, phone, mobile, age, city, address } = req.body;
    const normalizedName = String(name || "").trim().replace(/\s+/g, " ");
    const userPhone = String(phone || mobile || "").trim();
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const patientAge = Number(age);

    if (!normalizedName || !normalizedEmail || !password || !userPhone || !age || !city || !address) {
      return res.status(400).json({ message: "Name, age, email, phone, city, address and password are required" });
    }

    if (!Number.isInteger(patientAge) || patientAge < 18 || patientAge > 120) {
      return res.status(400).json({ message: "Age must be a whole number between 18 and 120" });
    }

    const passwordErrors = getPasswordValidationErrors(password);
    if (passwordErrors.length) {
      return res.status(400).json({ message: passwordErrors.join(". ") });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please login instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const details = {
      name: normalizedName,
      email: normalizedEmail,
      phone: userPhone,
      age: patientAge,
      city: String(city).trim(),
      address: String(address).trim(),
      password: hashedPassword,
      role: "patient",
      isVerified: true
    };
    await new User(details).validate();
    registrationId = pendingRegistrations.create(details, otp);

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        subject: "Verify your INDIPATH account",
        otp
      });
    } catch (emailError) {
      console.error("Registration email failure:", {
        code: emailError.code || "EMAIL_ERROR",
        responseCode: emailError.responseCode || null
      });
      if (canExposeDevOtp()) {
        console.warn("Registration email unavailable; using development OTP");
        return res.status(201).json({
          message: "Email delivery is unavailable. Use the development OTP shown below.",
          devOtp: otp,
          registrationId
        });
      }

      // Do not leave an unusable, unverified account when OTP delivery fails.
      pendingRegistrations.discard(registrationId);
      console.error("Registration OTP delivery failed");
      return res.status(503).json({
        message: "Unable to send verification email. Please try again later."
      });
    }

    res.status(201).json({
      message: "OTP sent to your email. Verify it to complete registration.",
      registrationId
    });
  } catch (error) {
    pendingRegistrations.discard(registrationId);
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message || "Registration validation failed";
      return res.status(400).json({ message });
    }

    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { registrationId, otp } = req.body;
  const pending = pendingRegistrations.take(registrationId);
  if (!pending || pending.otp !== String(otp || "")) {
    return res.status(400).json({ message: "Invalid or expired OTP. Please start registration again.", registrationCancelled: true });
  }
  try {
    // One atomic document insert is the registration commit point.
    await User.create(pending.details);
    return res.json({ message: "Registration completed. You can now log in." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered. Please log in.", registrationCancelled: true });
    }
    return res.status(500).json({ message: "Registration could not be completed. Please try again.", registrationCancelled: true });
  }
};

const cancelRegistration = async (req, res) => {
  pendingRegistrations.discard(req.body.registrationId);
  return res.json({ message: "Pending registration discarded" });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
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

const receptionistLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || normalizeRole(user.role) !== "receptionist") {
      return res.status(401).json({ message: "Invalid receptionist credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid receptionist credentials" });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Receptionist account is not active" });
    }

    res.json({
      message: "Receptionist login successful",
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Receptionist login failed", error: error.message });
  }
};

const technicianLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || normalizeRole(user.role) !== "technician") {
      return res.status(401).json({ message: "Invalid technician credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid technician credentials" });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Technician account is not active" });
    }

    res.json({
      message: "Technician login successful",
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Technician login failed", error: error.message });
  }
};

const pathologistLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || normalizeRole(user.role) !== "pathologist") {
      return res.status(401).json({ message: "Invalid pathologist credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid pathologist credentials" });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Pathologist account is not active" });
    }

    res.json({
      message: "Pathologist login successful",
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Pathologist login failed", error: error.message });
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

    try {
      await sendOtpEmail({
        to: user.email,
        subject: "Reset your INDIPATH password",
        otp
      });
    } catch (emailError) {
      if (canExposeDevOtp()) {
        console.warn(`Password reset email unavailable; using development OTP for ${user.email}`);
        return res.json({
          message: "Email delivery is unavailable. Use the development OTP shown below.",
          devOtp: otp
        });
      }

      user.otp = undefined;
      user.otpExpiry = undefined;
      user.resetPasswordVerified = false;
      await user.save();
      return res.status(503).json({ message: "Unable to send password reset email. Please try again later." });
    }

    res.json({
      message: "Password reset OTP sent to your email"
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

module.exports = { register, verifyOtp, cancelRegistration, login, receptionistLogin, technicianLogin, pathologistLogin, forgotPassword, verifyResetOtp, resetPassword, normalizeRole };
