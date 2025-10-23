import express from 'express';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { addEmailJob, addNotificationJob } from '../utils/queue.js';

const router = express.Router();

// Initialize Razorpay instance (only if keys are available)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️  Razorpay keys not found. Payment features will be disabled.');
}

// ------------------- USER ROUTES -------------------

// Get all bookings for a user (any authenticated user can access their own bookings)
router.get('/user', protect(), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments({ user: req.user.id });

    const bookings = await Booking.find({ user: req.user.id })
      .populate('service', 'name category price duration')
      .populate('provider', 'name company phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings for a user (any authenticated user can access their own bookings) - without pagination
router.get('/user/all', protect(), async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('service', 'name category price duration')
      .populate('provider', 'name company phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings for a provider
router.get('/provider', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    const bookings = await Booking.find({ provider: req.user.id })
      .populate('service', 'name category price duration location')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new booking with Razorpay order
router.post('/', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'User access required' });
    }

    const { serviceId, date, time, notes } = req.body;

    // Check if service exists and is approved
    const service = await Service.findById(serviceId);
    if (!service || service.status !== 'approved') {
      return res.status(400).json({ message: 'Service not available' });
    }

    // Create Razorpay order
    const options = {
      amount: service.price * 100, // in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id) {
      throw new Error('Failed to create Razorpay order. Please check Razorpay keys.');
    }

    // Create booking in pending status
    const booking = new Booking({
      user: req.user.id,
      service: serviceId,
      provider: service.provider,
      date: new Date(date),
      time,
      notes,
      price: service.price,
      location: service.location,
      razorpayOrderId: order.id,
      status: 'payment_pending',
      paymentStatus: 'pending'
    });

    await booking.save();
    await booking.populate('service', 'name category price duration');
    await booking.populate('provider', 'name company phone');

    res.status(201).json({ booking, order });
  } catch (error) {
    console.error('Error creating booking/order:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Razorpay payment and update booking
router.post('/verify-payment', protect(), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Payment verified, update booking
      const booking = await Booking.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentStatus: 'paid',
          status: 'pending'
        },
        { new: true }
      )
      .populate('service', 'name category price duration')
      .populate('provider', 'name company phone');

      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      res.json({ success: true, booking });
    } else {
      // Payment verification failed
      await Booking.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );

      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ------------------- BOOKING MANAGEMENT -------------------

// Bulk update booking status (provider or admin) - OPTIMIZED FOR INSTANT RESPONSE
router.put('/bulk/status', protect(), async (req, res) => {
  try {
    const { bookingIds, status, notes } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ message: 'bookingIds must be a non-empty array' });
    }

    if (!['approved', 'rejected', 'scheduled', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find all bookings to validate access and collect data for notifications
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate('user', 'name email')
      .populate('service', 'name')
      .populate('provider', 'name company phone');

    if (bookings.length !== bookingIds.length) {
      return res.status(404).json({ message: 'Some bookings not found' });
    }

    // Validate access - user must be admin or provider for all bookings
    for (const booking of bookings) {
      if (req.user.role !== 'admin' && booking.provider.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Access denied for one or more bookings' });
      }
    }

    const updatedBookings = [];
    const rejectedBookings = [];

    // Process each booking
    for (const booking of bookings) {
      if (status === 'rejected') {
        // Handle rejection: queue email asynchronously, then delete booking
        // Queue rejection email asynchronously (non-blocking)
        addEmailJob('booking_rejection', {
          email: booking.user.email,
          name: booking.user.name,
          serviceName: booking.service.name,
          notes: notes || 'No additional notes provided.'
        }).catch(emailError => {
          // Error handling for email queuing
        });

        // Delete booking
        await Booking.findByIdAndDelete(booking._id);
        rejectedBookings.push(booking._id);
      } else {
        // Update booking status in MongoDB (blocking for data consistency)
        const updateData = { status };
        if (notes) updateData.notes = notes;

        const updatedBooking = await Booking.findByIdAndUpdate(
          booking._id,
          updateData,
          { new: true }
        )
        .populate('service', 'name category price duration')
        .populate('user', 'name phone')
        .populate('provider', 'name company phone');

        updatedBookings.push(updatedBooking);

        // Queue email and notification asynchronously (non-blocking)
        const asyncOperations = [];

        // Email notification
        const emailPromise = (async () => {
          try {
            if (status === 'approved') {
              const message = notes ? `Your booking has been approved. Notes from provider: ${notes}` : 'Your booking has been approved.';
              await addEmailJob('booking_approval', {
                email: booking.user.email,
                name: booking.user.name,
                serviceName: booking.service.name,
                notes: message
              });
            } else if (status === 'scheduled') {
              await addEmailJob('booking_scheduled', {
                email: booking.user.email,
                name: booking.user.name,
                serviceName: booking.service.name,
                date: booking.date,
                time: booking.time
              });
            } else if (status === 'in_progress') {
              await addEmailJob('booking_in_progress', {
                email: booking.user.email,
                name: booking.user.name,
                serviceName: booking.service.name
              });
            } else if (status === 'completed') {
              await addEmailJob('booking_completed', {
                email: booking.user.email,
                name: booking.user.name,
                serviceName: booking.service.name,
                bookingId: booking._id
              });
            }
          } catch (emailError) {
            // Error handling for email queuing
          }
        })();

        // Socket.IO notification
        const notificationPromise = (async () => {
          try {
            await addNotificationJob('booking_status_update', { booking: updatedBooking }, req.app.get('io'));
          } catch (notificationError) {
            // Error handling for notification queuing
          }
        })();

        asyncOperations.push(emailPromise, notificationPromise);

        // Fire and forget - don't await these async operations
        Promise.all(asyncOperations).catch(error => {
          // Error handling for async operations
        });
      }
    }

    // Respond immediately with results
    res.json({
      message: `Bulk status update completed. ${updatedBookings.length} updated, ${rejectedBookings.length} rejected.`,
      updatedBookings,
      rejectedBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking status (provider or admin) - OPTIMIZED FOR INSTANT RESPONSE
router.put('/:id/status', protect(), async (req, res) => {
  const startTime = Date.now();
  console.log(`🚀 Starting booking status update for ID: ${req.params.id}`);

  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'scheduled', 'in_progress', 'completed'].includes(status)) {
      console.log('❌ Invalid status provided:', status);
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Fetch booking data first
    const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('service', 'name');
    if (!booking) {
      console.log('❌ Booking not found:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.provider.toString() !== req.user.id.toString()) {
      console.log('❌ Access denied for user:', req.user.id, 'booking provider:', booking.provider);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`📝 Processing status update: ${booking.status} -> ${status}`);

    if (status === 'rejected') {
      // Handle rejection: queue email asynchronously, then delete booking
      console.log('🗑️ Processing booking rejection...');

      // Queue rejection email asynchronously (non-blocking)
      addEmailJob('booking_rejection', {
        email: booking.user.email,
        name: booking.user.name,
        serviceName: booking.service.name,
        notes: notes || 'No additional notes provided.'
      }).catch(emailError => {
        console.error('❌ Error queuing rejection email:', emailError);
      });

      // Delete booking
      await Booking.findByIdAndDelete(req.params.id);
      console.log('✅ Booking rejected and deleted successfully');

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Rejection response time: ${responseTime}ms`);
      return res.json({ message: 'Booking rejected and deleted successfully' });
    }

    // Update booking status in MongoDB (blocking for data consistency)
    const updateData = { status };
    if (notes) updateData.notes = notes;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('service', 'name category price duration')
    .populate('user', 'name phone')
    .populate('provider', 'name company phone');

    console.log('✅ Booking status updated in database');

    // Queue email notification asynchronously (non-blocking)
    console.log('📧 Queuing email notification asynchronously...');
    const emailPromise = (async () => {
      try {
        if (status === 'approved') {
          const message = notes ? `Your booking has been approved. Notes from provider: ${notes}` : 'Your booking has been approved.';
          await addEmailJob('booking_approval', {
            email: booking.user.email,
            name: booking.user.name,
            serviceName: booking.service.name,
            notes: message
          });
          console.log('📧 Approval email queued successfully');
        } else if (status === 'scheduled') {
          await addEmailJob('booking_scheduled', {
            email: booking.user.email,
            name: booking.user.name,
            serviceName: booking.service.name,
            date: booking.date,
            time: booking.time
          });
          console.log('📧 Scheduled email queued successfully');
        } else if (status === 'in_progress') {
          await addEmailJob('booking_in_progress', {
            email: booking.user.email,
            name: booking.user.name,
            serviceName: booking.service.name
          });
          console.log('📧 In progress email queued successfully');
        } else if (status === 'completed') {
          await addEmailJob('booking_completed', {
            email: booking.user.email,
            name: booking.user.name,
            serviceName: booking.service.name,
            bookingId: req.params.id
          });
          console.log('📧 Completed email queued successfully');
        }
      } catch (emailError) {
        console.error('❌ Error queuing email notification:', emailError);
      }
    })();

    // Queue Socket.IO notification asynchronously (non-blocking)
    console.log('🔔 Queuing Socket.IO notification asynchronously...');
    const notificationPromise = (async () => {
      try {
        await addNotificationJob('booking_status_update', { booking: updatedBooking }, req.app.get('io'));
        console.log('🔔 Socket.IO notification queued successfully');
      } catch (notificationError) {
        console.error('❌ Error queuing Socket.IO notification:', notificationError);
      }
    })();

    // Fire and forget - don't await these async operations
    Promise.all([emailPromise, notificationPromise]).catch(error => {
      console.error('❌ Error in async operations:', error);
    });

    // Respond immediately with updated booking data
    const responseTime = Date.now() - startTime;
    console.log(`⚡ Status update response time: ${responseTime}ms`);

    res.json(updatedBooking);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Server error in status update (${responseTime}ms):`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking (user or admin)
router.patch('/:id/cancel', protect(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role !== 'admin' &&
        booking.user.toString() !== req.user.id.toString() &&
        !(req.user.role === 'provider' && booking.provider.toString() === req.user.id.toString() && booking.status === 'confirmed')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['payment_pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    )
    .populate('service', 'name category price duration')
    .populate('provider', 'name company phone');

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single booking
router.get('/:id', protect(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category price duration location')
      .populate('user', 'name phone')
      .populate('provider', 'name company phone');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user.id.toString() &&
      booking.provider.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available time slots for a service on a specific date
router.get('/available-slots/:serviceId/:date', async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const bookedSlots = await Booking.find({
      service: serviceId,
      date: new Date(date),
      status: { $in: ['payment_pending', 'confirmed', 'scheduled', 'in_progress'] }
    }).select('time');

    const bookedTimes = bookedSlots.map(b => b.time);

    const allSlots = [
      '09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'
    ];

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ availableSlots, bookedSlots: bookedTimes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/review', protect(), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // Fetch booking by both ID and user ID for security
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found or access denied' });

    // Case-insensitive status check
    if (!['completed', 'reviewed'].includes(booking.status.toLowerCase())) {
      return res.status(400).json({ message: 'You can only review services you have completed' });
    }

    // Check if user already reviewed
    const alreadyReviewed = booking.reviews.some(r => r.user.toString() === req.user.id.toString());
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Add review to booking
    booking.reviews.push({
      user: req.user.id,
      rating,
      comment,
      service: booking.service
    });

    // Update booking status to reviewed
    booking.status = 'reviewed';

    await booking.save();

    // Update service rating and review count
    const service = await Service.findById(booking.service);
    if (service) {
      // Get all reviews for this service from all bookings
      const allBookings = await Booking.find({
        service: booking.service,
        status: { $regex: /^reviewed$/i }
      }).select('reviews');

      let totalRating = 0;
      let totalReviews = 0;

      allBookings.forEach(b => {
        b.reviews.forEach(review => {
          totalRating += review.rating;
          totalReviews += 1;
        });
      });

      const newAverageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      await Service.findByIdAndUpdate(booking.service, {
        rating: newAverageRating,
        reviewCount: totalReviews
      });
    }

    res.json({ message: 'Review submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
