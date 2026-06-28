const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  age: { type: Number },
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
