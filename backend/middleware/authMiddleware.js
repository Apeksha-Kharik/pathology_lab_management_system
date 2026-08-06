const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_pathology_secret");
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  const userRole = String(req.user?.role || "").trim().toLowerCase();
  const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());

  if (!req.user || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: "Access denied" });
  }

  req.user.role = userRole;
  next();
};

module.exports = { protect, allowRoles };
