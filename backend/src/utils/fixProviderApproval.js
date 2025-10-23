import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from '../models/Provider.js';

dotenv.config();

const fixProviderApproval = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Find providers with approvalStatus 'approved' but isApproved false
    const providersToFix = await Provider.find({
      approvalStatus: 'approved',
      isApproved: false
    });

    // Update each provider
    for (const provider of providersToFix) {
      await Provider.findByIdAndUpdate(provider._id, {
        isApproved: true
      });
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

fixProviderApproval();
