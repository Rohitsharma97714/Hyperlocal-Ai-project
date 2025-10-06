import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Admin from '../models/Admin.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Apply auth middleware to all protected routes
router.use(protect());





// Get user's bookings
router.get('/bookings', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ user: userId })
      .populate('service', 'name description price')
      .populate('provider', 'name')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get provider's bookings
router.get('/provider/bookings', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookings = await Booking.find({ provider: providerId })
      .populate('service', 'name description price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider bookings', error: error.message });
  }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    ).populate('service', 'name').populate('user', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

router.get('/search', (req, res) => {
  const { query } = req.query;
  // TODO: Implement search logic
  res.json({ message: `Search results for: ${query}`, results: [] });
});

export default router;
