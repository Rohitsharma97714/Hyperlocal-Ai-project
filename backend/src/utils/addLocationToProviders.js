import mongoose from 'mongoose';
import Provider from '../models/Provider.js';
import { connectDB } from '../config/db.js';

const addLocationToProviders = async () => {
  try {
    await connectDB();

    // Update all providers that don't have a location field
    const result = await Provider.updateMany(
      { location: { $exists: false } },
      { $set: { location: '' } }
    );

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

addLocationToProviders();
