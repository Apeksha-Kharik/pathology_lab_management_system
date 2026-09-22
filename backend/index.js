const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const { verifyTransporter } = require("./config/email");
const ensureDefaultPackages = require("./utils/ensureDefaultPackages");
const ensureDefaultTests = require("./utils/ensureDefaultTests");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const pathologistRoutes = require("./routes/pathologistRoutes");
const profileRoutes = require("./routes/profileRoutes");
const documentRoutes = require("./routes/documentRoutes");
const { validateRequest } = require("./middleware/validateRequest");

dotenv.config();
verifyTransporter();

const app = express();

const localOrigins = [
  /^http:\/\/localhost:51\d{2}$/,
  /^http:\/\/127\.0\.0\.1:51\d{2}$/
];
const configuredOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin) || localOrigins.some((allowedOrigin) => allowedOrigin.test(origin))) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use(validateRequest);
app.use("/uploads/signatures", express.static(path.join(__dirname, "uploads", "signatures"), {
  dotfiles: "deny",
  fallthrough: false,
  immutable: true,
  maxAge: "1y",
  index: false,
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'");
  }
}));

app.get("/", (req, res) => {
  res.send("Pathology Lab Server Running");
});

app.use("/", authRoutes);
app.use("/", patientRoutes);
app.use("/", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/pathologist", pathologistRoutes);
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await ensureDefaultTests();
  await ensureDefaultPackages();

  app.listen(PORT, () => {
    console.log(`Server active on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
