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
router.get('/bookings/user', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find({ user: userId })
      .populate('service', 'name description price location')
      .populate('provider', 'name')
      .populate('reviews')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
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

router.get('/search', async (req, res) => {
  try {
    const { query, category, location, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = { status: 'approved' };

    // Build search conditions
    const searchConditions = [
      { name: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
      { category: new RegExp(query, 'i') },
      { location: new RegExp(query, 'i') }
    ];

    searchQuery.$or = searchConditions;

    // Add optional filters
    if (category) {
      searchQuery.category = new RegExp(category, 'i');
    }
    if (location) {
      searchQuery.location = new RegExp(location, 'i');
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const services = await Service.find(searchQuery)
      .populate('provider', 'name company rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalServices = await Service.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalServices / parseInt(limit));

    res.json({
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalServices,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error performing search', error: error.message });
  }
});

export default router;
