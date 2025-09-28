import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import connectDB from '../config/db.js';

dotenv.config();

const fixBookingStatus = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Find bookings that are not completed or reviewed
    const bookingsToFix = await Booking.find({
      status: { $nin: ['completed', 'reviewed'] }
    }).populate('service', 'name').populate('user', 'name email');

    console.log(`Found ${bookingsToFix.length} bookings to potentially fix`);

    // Update the first booking to completed for testing
    if (bookingsToFix.length > 0) {
      const booking = bookingsToFix[0];
      await Booking.findByIdAndUpdate(booking._id, {
        status: 'completed'
      });
      console.log(`Fixed booking for user: ${booking.user.email}, service: ${booking.service.name}, status set to: completed`);
    } else {
      console.log('No bookings found that need fixing');
    }

    console.log('Booking status fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing booking status:', error);
    process.exit(1);
  }
};

fixBookingStatus();
