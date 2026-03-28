require('dns').setDefaultResultOrder('ipv4first');

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Booking = require("./models/Booking");
const Report = require("./models/Report");

app.use(cors());
app.use(express.json());

// ✅ CONNECT DATABASE
mongoose.connect("mongodb://kharikapeksha01_db_user:admin%40123@ac-nqyhccq-shard-00-00.nm2joai.mongodb.net:27017,ac-nqyhccq-shard-00-01.nm2joai.mongodb.net:27017,ac-nqyhccq-shard-00-02.nm2joai.mongodb.net:27017/?ssl=true&replicaSet=atlas-n10f2s-shard-0&authSource=admin&retryWrites=true&w=majority");

mongoose.connection.on("connected", () => {
    console.log("MongoDB Connected ✅");
});


app.get("/my-bookings/:userId", async (req, res) => {
  try {
    const data = await Booking.find({ userId: req.params.userId });
    res.json(data);
  } catch (error) {
    res.json([]);
  }
});


app.get("/my-reports/:userId", async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.params.userId });
    res.json(reports);
  } catch (error) {
    res.json([]);
  }
});

// TEST
app.get("/", (req, res) => {
    res.send("Server Running 🚀");
});

// REGISTER API
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, mobile, address } = req.body;

    // ✅ Check empty fields
    if (!name || !email || !password || !mobile || !address) {
      return res.json({ message: "All fields are required ❌" });
    }

app.post("/book-test", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    res.json({ message: "Test booked successfully ✅" });

  } catch (error) {
    console.log(error);
    res.json({ message: "Error ❌" });
  }
});

    // ✅ Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ message: "Invalid email format ❌" });
    }

    // ✅ Mobile check
    if (mobile.length !== 10) {
      return res.json({ message: "Invalid mobile number ❌" });
    }

    // ✅ Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists ❌" });
    }

    // ✅ Save user
    const newUser = new User({
      name,
      email,
      password,
      mobile,
      address
    });

    await newUser.save();

    res.json({ message: "Registration Successful ✅" });

  } catch (error) {
    console.log(error);
    res.json({ message: "Server Error ❌" });
  }
});
app.listen(5000, () => {
    console.log("Server running on port 5000");
});