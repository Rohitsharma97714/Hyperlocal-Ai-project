import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from '../models/Provider.js';

dotenv.config();

const fixProviderApproval = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find providers with approvalStatus 'approved' but isApproved false
    const providersToFix = await Provider.find({
      approvalStatus: 'approved',
      isApproved: false
    });

    console.log(`Found ${providersToFix.length} providers to fix`);

    // Update each provider
    for (const provider of providersToFix) {
      await Provider.findByIdAndUpdate(provider._id, {
        isApproved: true
      });
      console.log(`Fixed provider: ${provider.email}`);
    }

    console.log('All providers fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing providers:', error);
    process.exit(1);
  }
};

fixProviderApproval();
