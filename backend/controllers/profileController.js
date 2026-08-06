const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getProfile = async (req, res) => {
  res.json(req.user);
};

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

  if (!/[0-9]/.test(password || "")) {
    errors.push("Password must include at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password || "")) {
    errors.push("Password must include at least one special character");
  }

  return errors;
};

const updateProfile = async (req, res) => {
  try {
    const {
      address,
      age,
      city,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      gender,
      name,
      phone,
      pincode,
      referredBy,
      state
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const patientAge = age === "" || age === undefined ? undefined : Number(age);
    if (patientAge !== undefined && (!Number.isInteger(patientAge) || patientAge < 18 || patientAge > 120)) {
      return res.status(400).json({ message: "Age must be a whole number between 18 and 120" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        address,
        age: patientAge,
        city,
        dateOfBirth: dateOfBirth || undefined,
        emergencyContactName,
        emergencyContactPhone,
        gender,
        name,
        phone,
        pincode,
        referredBy,
        state
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const passwordErrors = getPasswordValidationErrors(newPassword);
    if (passwordErrors.length) {
      return res.status(400).json({ message: passwordErrors.join(". ") });
    }

    const user = await User.findById(req.user._id);
    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Password change failed", error: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
