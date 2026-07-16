const express = require("express");
const {
  register,
  verifyOtp,
  cancelRegistration,
  login,
  receptionistLogin,
  technicianLogin,
  pathologistLogin,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/cancel-registration", cancelRegistration);
router.delete("/cleanup-email/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const result = await User.deleteMany({ email: email, isVerified: false });
    res.json({ 
      message: `Cleaned up ${result.deletedCount} unverified record(s) for ${email}`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: "Cleanup failed", error: error.message });
  }
});
router.post("/login", login);
router.post("/receptionist/login", receptionistLogin);
router.post("/technician/login", technicianLogin);
router.post("/pathologist/login", pathologistLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
