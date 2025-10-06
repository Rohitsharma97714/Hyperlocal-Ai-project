// src/models/Provider.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    match: [/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/, 'Password must include uppercase, lowercase, number, special character']
  },
  phone: {
    type: String,
    match: [/^[0-9]{10,12}$/, 'Phone must be 10-12 digits']
  },
  location: { type: String, trim: true },
  company: { type: String, trim: true },
  // Provider approval and verification
  isApproved: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: String, // Admin notes for approval/rejection
  // Verification fields
  otp: Number,
  otpExpiry: Date,
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  tempPassword: String,
  // Service provider details
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  businessLicense: String, // URL to business license document
  insurance: String, // URL to insurance document

}, { timestamps: true });

providerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

providerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

export default mongoose.model('Provider', providerSchema);
