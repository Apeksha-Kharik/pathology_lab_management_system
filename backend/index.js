const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User'); // Import the Model

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());

// Registration API
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered! ❌" });
    }

    // Create new user
    const newUser = new User({ name, email, password, mobile, address });
    await newUser.save();

    res.status(201).json({ message: "Registration Successful! ✅" });
  } catch (error) {
    res.status(500).json({ message: "Server Error ❌" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));