require('dns').setDefaultResultOrder('ipv4first');
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// Models
const User = require("./models/User");
const Test = require("./models/Test");
const Booking = require("./models/Booking");

app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION
mongoose.connect("mongodb://kharikapeksha01_db_user:admin%40123@ac-nqyhccq-shard-00-00.nm2joai.mongodb.net:27017,ac-nqyhccq-shard-00-01.nm2joai.mongodb.net:27017,ac-nqyhccq-shard-00-02.nm2joai.mongodb.net:27017/?ssl=true&replicaSet=atlas-n10f2s-shard-0&authSource=admin&retryWrites=true&w=majority");

mongoose.connection.on("connected", () => console.log("MongoDB Atlas Connected ✅"));

// --- FIXED REGISTRATION API ---
app.post("/register", async (req, res) => {
    try {
        console.log("Registration Attempt:", req.body); // Check terminal for this!
        const { name, email, password, mobile, address, role } = req.body;

        // Validation - Ensure all these keys exist in your frontend state
        if (!name || !email || !password || !mobile || !address) {
            return res.status(400).json({ message: "All fields are required ❌" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists ❌" });
        }

        const newUser = new User({ name, email, password, mobile, address, role: role || "Technician" });
        await newUser.save();

        res.json({ message: "Registration Successful ✅" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error ❌" });
    }
});

// --- FIXED ADD TEST API ---
app.post("/api/admin/add-test", async (req, res) => {
    try {
        console.log("Adding Test:", req.body);
        const { testName, category, price, conditions, description } = req.body;

        if (!testName || !price) {
            return res.status(400).json({ message: "Test Name and Price are required ❌" });
        }

        const newTest = new Test({ 
            testName, 
            category, 
            price: Number(price), 
            conditions, 
            description 
        });

        await newTest.save();
        res.json({ message: "Test Added Successfully! ✅" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding test ❌" });
    }
});

// Admin fetching routes
app.get("/api/admin/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Add this to your server.js
app.get("/api/admin/tests", async (req, res) => {
  try {
    const tests = await Test.find(); // Fetches all tests from your Atlas "tests" collection
    res.json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json([]);
  }
});
app.delete("/api/admin/test/:id", async (req, res) => {
    try {
        await Test.findByIdAndDelete(req.params.id);
        res.json({ message: "Test deleted successfully ✅" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete test" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));