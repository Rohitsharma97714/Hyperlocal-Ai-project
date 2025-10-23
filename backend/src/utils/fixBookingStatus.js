import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import connectDB from '../config/db.js';

dotenv.config();

const fixBookingStatus = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Find bookings that are not completed or reviewed
    const bookingsToFix = await Booking.find({
      status: { $nin: ['completed', 'reviewed'] }
    }).populate('service', 'name').populate('user', 'name email');

    // Update the first booking to completed for testing
    if (bookingsToFix.length > 0) {
      const booking = bookingsToFix[0];
      await Booking.findByIdAndUpdate(booking._id, {
        status: 'completed'
      });
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

fixBookingStatus();
