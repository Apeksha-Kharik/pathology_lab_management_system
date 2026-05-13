const express = require("express");
const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
