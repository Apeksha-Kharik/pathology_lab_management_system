const User = require("../models/User");
const Test = require("../models/Test");
const bcrypt = require("bcryptjs");
const { normalizeRole } = require("./authController");

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, mobile, role } = req.body;
    const userPhone = phone || mobile;

    if (!name || !email || !password || !userPhone || !role) {
      return res.status(400).json({ message: "Name, email, phone, password and role are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      phone: userPhone,
      password: await bcrypt.hash(password, 10),
      role: normalizeRole(role),
      isVerified: true
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

const addTest = async (req, res) => {
  try {
    const { testName, category, price, description, conditions } = req.body;

    if (!testName || !category || !price) {
      return res.status(400).json({ message: "Test name, category and price are required" });
    }

    const test = await Test.create({
      testName,
      category,
      price: Number(price),
      description,
      conditions
    });

    res.status(201).json({ message: "Test added successfully", test });
  } catch (error) {
    res.status(500).json({ message: "Error adding test" });
  }
};

const getTests = async (req, res) => {
  try {
    const tests = await Test.find();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tests" });
  }
};

const deleteTest = async (req, res) => {
  try {
    const deletedTest = await Test.findByIdAndDelete(req.params.id);
    if (!deletedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting test" });
  }
};

module.exports = { createUser, getUsers, deleteUser, addTest, getTests, deleteTest };
