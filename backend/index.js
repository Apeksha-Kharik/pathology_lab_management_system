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
  methods: ["GET", "POST", "DELETE", "OPTIONS"], // Added OPTIONS for pre-flight checks
  credentials: true
}));
app.use(express.json());

// --- ROUTES ---

// 1. Test Route
app.get('/', (req, res) => res.send('Pathology Lab Server Running... 🚀'));

// 2. Registration API
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, address, role, dateOfJoining } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered! ❌" });
    }

    const newUser = new User({ 
      name, 
      email, 
      password, 
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

// 3. Login API
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

// 5. Add a New Test
app.post('/api/admin/add-test', async (req, res) => {
    try {
        const { testName, category, price, description, conditions } = req.body;
        
        const newTest = new Test({ 
            testName, 
            category, 
            price: Number(price), 
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

// 8. Delete Test (ADDED THIS MISSING ROUTE)
app.delete('/api/admin/test/:id', async (req, res) => {
    try {
        const deletedTest = await Test.findByIdAndDelete(req.params.id);
        if (!deletedTest) {
            return res.status(404).json({ message: "Test not found" });
        }
        res.json({ message: "Test deleted successfully ✅" });
    } catch (err) {
        console.error("Delete Test Error:", err);
        res.status(500).json({ message: "Error deleting test from database" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));