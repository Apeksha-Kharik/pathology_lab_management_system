

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: String,
  reportUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Report", reportSchema);