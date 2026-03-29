const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  role: { 
      type: String, 
      enum: ['Admin', 'Pathologist', 'Technician', 'Receptionist', 'Patient'], 
      default: 'Patient' 
  },
  // Date of joining is only for staff, so we don't make it 'required' here
  // We can handle the logic in the frontend or backend route
  dateOfJoining: { 
      type: Date, 
      required: function() {
          // This makes the field required ONLY if the role is a staff role
          return ['Pathologist', 'Technician', 'Receptionist'].includes(this.role);
      }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);