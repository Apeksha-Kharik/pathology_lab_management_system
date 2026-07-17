const mongoose = require('mongoose');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: async function (value) {
        if (this.role !== "patient" || !value) {
          return true;
        }

        const existingUser = await this.constructor.findOne({
          _id: { $ne: this._id },
          role: "patient",
          name: { $regex: `^${escapeRegex(value.trim())}$`, $options: "i" }
        });

        return !existingUser;
      },
      message: "Name already exists"
    }
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  age: {
    type: Number,
    min: [18, "Age must be 18 or above"],
    max: [120, "Age must be 120 or below"],
    validate: {
      validator: Number.isInteger,
      message: "Age must be a whole number"
    }
  },
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say", ""], default: "" },
  dateOfBirth: { type: Date },
  address: { type: String },
  city: { type: String },
  pincode: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  referredBy: { type: String },
  qualification: { type: String },
  password: { type: String, required: true },
  role: { 
      type: String, 
      enum: ['admin', 'patient', 'receptionist', 'technician', 'pathologist'], 
      default: 'patient',
      lowercase: true
  },
  isVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetPasswordVerified: { type: Boolean, default: false },
  resetPasswordExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
