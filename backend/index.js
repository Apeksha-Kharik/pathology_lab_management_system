const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

// Load Config & Connect DB
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Test Route
app.get('/', (req, res) => res.send('Pathology Lab Server Running... 🚀'));

// 2. Registration API
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, address, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists! ❌" });
    }

    const newUser = new User({ name, email, password, mobile, address, role });
    await newUser.save();

    res.status(201).json({ message: "Registration Successful! ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error during registration ❌" });
  }
});

// 3. Login API (Basic Version)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.password === password) { // In production, use bcrypt to compare!
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));