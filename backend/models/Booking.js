

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: String,
  name: String,
  testName: String,
  age: Number,
  phone: String,
  email: String,
  date: String,
  homeSample: Boolean,
  status: {
    type: String,
    default: "Pending"
  }
});

module.exports = mongoose.model("Booking", bookingSchema);