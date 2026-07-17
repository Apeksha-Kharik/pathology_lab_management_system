const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  packageName: { type: String, required: true, trim: true },
  category: { type: String, default: "Health Checkup", trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  includedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
  parametersCount: { type: Number, default: 0, min: 0 },
  homeCollection: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
