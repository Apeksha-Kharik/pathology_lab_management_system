const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Test = require('./models/Test');

// Load Config & Connect DB
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Allow your Vite React app
  methods: ["GET", "POST", "DELETE"], // Added DELETE for the delete button
  credentials: true
}));
app.use(express.json());

// --- ROUTES ---

// 1. Test Route
app.get('/', (req, res) => res.send('Pathology Lab Server Running... 🚀'));

// 2. Registration API - UPDATED with mobile, address, and dateOfJoining
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, address, role, dateOfJoining } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered! ❌" });
    }

    // 2. Create new user with ALL fields
    const newUser = new User({ 
      name, 
      email, 
      password, // Note: In a real project, use bcrypt to hash this!
      mobile, 
      address, 
      role, 
      dateOfJoining: dateOfJoining || null 
    });

    await newUser.save();
    res.status(201).json({ message: "Registration Successful! ✅" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

// 3. Login API (Basic Version)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.password === password) { 
      res.json({ 
        message: "Login successful! 🔓", 
        user: { name: user.name, role: user.role } 
      });
    } else {
      res.status(401).json({ message: "Invalid credentials! ❌" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login Error ❌" });
  }
});

// 4. Get all Users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// 5. Add a New Test - UPDATED with conditions
app.post('/api/admin/add-test', async (req, res) => {
    try {
        const { testName, category, price, description, conditions } = req.body;
        
        // Added conditions to the new Test object
        const newTest = new Test({ 
            testName, 
            category, 
            price: Number(price), // Ensuring price is a number
            description,
            conditions 
        });
        
        await newTest.save();
        res.status(201).json({ message: "Test Added Successfully! 🧪" });
    } catch (err) {
        console.error("Add Test Error:", err);
        res.status(500).json({ message: "Error adding test" });
    }
});

// 6. Get all Tests
app.get('/api/admin/tests', async (req, res) => {
    try {
        const tests = await Test.find();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tests" });
    }
});

// 7. Delete User
app.delete('/api/admin/user/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));