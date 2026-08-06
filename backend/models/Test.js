const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    conditions: { type: String }, // e.g. "Fast for 12 hours"
    sampleType: { type: String },
    turnaroundTime: { type: String },
    reportDescription: { type: String, default: "" },
    reportLetterhead: { type: String, default: "" },
    reportTemplate: [{
        parameter: { type: String, required: true },
        unit: { type: String, default: "" },
        referenceRange: { type: String, default: "" }
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Test", testSchema);
