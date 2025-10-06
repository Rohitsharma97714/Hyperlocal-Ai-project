import mongoose from 'mongoose';
import Provider from '../models/Provider.js';
import { connectDB } from '../config/db.js';

const addLocationToProviders = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Update all providers that don't have a location field
    const result = await Provider.updateMany(
      { location: { $exists: false } },
      { $set: { location: '' } }
    );

    console.log(`Updated ${result.modifiedCount} provider documents`);
    console.log('Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

addLocationToProviders();
