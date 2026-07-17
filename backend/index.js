const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const { verifyTransporter } = require("./config/email");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const pathologistRoutes = require("./routes/pathologistRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Load environment variables
dotenv.config();

// Verify SMTP Connection
verifyTransporter();

// Connect MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Pathology Lab Server Running");
});

// Routes
app.use("/", authRoutes);
app.use("/", patientRoutes);
app.use("/", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/pathologist", pathologistRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
});