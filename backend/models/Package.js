const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  packageName: { type: String, required: true, trim: true },
  packageCode: { type: String, required: true, trim: true, uppercase: true, unique: true, sparse: true },
  category: { type: String, default: "Health Checkup", trim: true },
  price: { type: Number, required: true, min: [0.01, "Package price must be greater than zero"] },
  discountPrice: { type: Number, min: [0, "Discount price cannot be negative"], default: null },
  description: { type: String, default: "" },
  reportDescription: { type: String, default: "" },
  reportLetterhead: { type: String, default: "" },
  reportTemplate: [{ parameter: { type: String, required: true }, value: { type: String, default: "" }, unit: { type: String, default: "" }, referenceRange: { type: String, default: "" } }],
  imageUrl: { type: String, default: "" },
  includedTests: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
    required: true,
    validate: {
      validator: (tests) => Array.isArray(tests) && tests.length > 0 && new Set(tests.map(String)).size === tests.length,
      message: "A package must contain at least one unique test"
    }
  },
  parametersCount: { type: Number, default: 0, min: 0 },
  homeCollection: { type: Boolean, default: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
