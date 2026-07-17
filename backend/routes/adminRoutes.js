const express = require("express");
const {
  getDashboardMetrics,
  getUsers,
  createUser,
  deleteUser,
  addTest,
  getTests,
  updateTest,
  deleteTest,
  getPackages,
  addPackage,
  deletePackage
} = require("../controllers/adminController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/tests", getTests);
router.get("/dashboard-metrics", protect, allowRoles("admin"), getDashboardMetrics);
router.get("/users", protect, allowRoles("admin"), getUsers);
router.post("/users", protect, allowRoles("admin"), createUser);
router.delete("/user/:id", protect, allowRoles("admin"), deleteUser);
router.post("/add-test", protect, allowRoles("admin"), addTest);
router.put("/test/:id", protect, allowRoles("admin"), updateTest);
router.delete("/test/:id", protect, allowRoles("admin"), deleteTest);
router.get("/packages", protect, allowRoles("admin"), getPackages);
router.post("/packages", protect, allowRoles("admin"), addPackage);
router.delete("/packages/:id", protect, allowRoles("admin"), deletePackage);

module.exports = router;
