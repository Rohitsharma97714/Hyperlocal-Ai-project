import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const fixAdminVerification = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Find admin users that are not verified
    const unverifiedAdmins = await Admin.find({
      isVerified: false
    });

    // Update each admin to be verified
    for (const admin of unverifiedAdmins) {
      await Admin.findByIdAndUpdate(admin._id, {
        isVerified: true,
        otp: null,
        otpExpiry: null
      });
    }

    // Also create a default verified admin if none exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const defaultAdmin = await Admin.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123!',
        isVerified: true
      });
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

fixAdminVerification();
