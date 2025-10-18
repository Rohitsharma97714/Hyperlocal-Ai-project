import express from 'express';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendBookingApprovalEmail, sendBookingRejectionEmail, sendBookingScheduledEmail, sendBookingInProgressEmail, sendBookingCompletedEmail } from '../utils/sendEmail.js';

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
      console.log('Service not found or not approved:', serviceId);
      return res.status(400).json({ message: 'Service not available' });
    }

    // Create Razorpay order
    const options = {
      amount: service.price * 100, // in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

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

// Update booking status (provider or admin)
router.put('/:id/status', protect(), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'scheduled', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('service', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role !== 'admin' && booking.provider.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status === 'rejected') {
      // Send rejection email before deleting booking
      try {
        console.log('📧 Sending rejection email...');
        await sendBookingRejectionEmail(booking.user.email, booking.user.name, booking.service.name, notes || 'No additional notes provided.');
        console.log('📧 Rejection email sent successfully.');
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }

      // Delete booking on rejection
      await Booking.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Booking rejected and deleted successfully' });
    }

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

    // Send email notification based on status
    console.log('📧 Preparing to send email for booking status update...');
    console.log('📧 Status:', status);
    console.log('📧 User email:', booking.user.email);
    console.log('📧 User name:', booking.user.name);
    console.log('📧 Service name:', booking.service.name);
    try {
      if (status === 'approved') {
        const message = notes ? `Your booking has been approved. Notes from provider: ${notes}` : 'Your booking has been approved.';
        console.log('📧 Sending approval email...');
        await sendBookingApprovalEmail(booking.user.email, booking.user.name, booking.service.name, message);
        console.log('📧 Approval email sent successfully.');
      } else if (status === 'scheduled') {
        console.log('📧 Sending scheduled email...');
        await sendBookingScheduledEmail(booking.user.email, booking.user.name, booking.service.name, booking.date, booking.time);
        console.log('📧 Scheduled email sent successfully.');
      } else if (status === 'in_progress') {
        console.log('📧 Sending in progress email...');
        await sendBookingInProgressEmail(booking.user.email, booking.user.name, booking.service.name);
        console.log('📧 In progress email sent successfully.');
      } else if (status === 'completed') {
        console.log('📧 Sending completed email...');
        await sendBookingCompletedEmail(booking.user.email, booking.user.name, booking.service.name, req.params.id);
        console.log('📧 Completed email sent successfully.');
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('bookingStatusUpdated', updatedBooking);
    }

    res.json(updatedBooking);
  } catch (error) {
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
