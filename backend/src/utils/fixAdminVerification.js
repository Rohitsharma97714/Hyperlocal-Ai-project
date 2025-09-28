import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const fixAdminVerification = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin users that are not verified
    const unverifiedAdmins = await Admin.find({
      isVerified: false
    });

    console.log(`Found ${unverifiedAdmins.length} unverified admin(s)`);

    // Update each admin to be verified
    for (const admin of unverifiedAdmins) {
      await Admin.findByIdAndUpdate(admin._id, {
        isVerified: true,
        otp: null,
        otpExpiry: null
      });
      console.log(`Verified admin: ${admin.email}`);
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
      console.log('Created default admin: admin@example.com with password: Admin123!');
    } else {
      console.log('Default admin already exists');
    }

    console.log('Admin verification fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin verification:', error);
    process.exit(1);
  }
};

fixAdminVerification();
