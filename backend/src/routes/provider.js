import express from 'express';
import Provider from '../models/Provider.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get provider profile
router.get('/profile', protect(['provider']), async (req, res) => {
  try {
    console.log(`Fetching profile for provider: ${req.user.id}`);
    const provider = await Provider.findById(req.user.id).select('name email phone company location isApproved approvalStatus createdAt');
    if (!provider) {
      console.error(`Provider not found: ${req.user.id}`);
      return res.status(404).json({ message: 'Provider not found' });
    }
    console.log(`Provider profile fetched: ${provider._id}`);
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get provider approval status
router.get('/status', protect(['provider']), async (req, res) => {
  try {
    console.log(`[Provider Status] Fetching approval status for provider: ${req.user.id}`);
    console.log(`[Provider Status] Request headers:`, req.headers);
    console.log(`[Provider Status] Request method: ${req.method}, path: ${req.path}`);
    const provider = await Provider.findById(req.user.id).select('isApproved approvalStatus adminNotes');
    if (!provider) {
      console.error(`[Provider Status] Provider not found: ${req.user.id}`);
      return res.status(404).json({ message: 'Provider not found' });
    }
    console.log(`[Provider Status] Provider status: ${provider.approvalStatus}, approved: ${provider.isApproved}`);
    res.json({
      isApproved: provider.isApproved,
      approvalStatus: provider.approvalStatus,
      adminNotes: provider.adminNotes
    });
  } catch (error) {
    console.error('[Provider Status] Error fetching provider status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update provider profile
router.put('/profile', protect(['provider']), async (req, res) => {
  try {
    const { name, email, phone, company, location } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (phone && !/^[0-9]{10,12}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be 10-12 digits' });
    }

    // Check if email is being changed and if it's unique
    if (email && email !== req.user.email) {
      const existingProvider = await Provider.findOne({ email });
      if (existingProvider) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Fetch current provider to check approval status
    const currentProvider = await Provider.findById(req.user.id);
    if (!currentProvider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    let updateData = {
      name: name.trim(),
      email,
      phone,
      company: company ? company.trim() : company,
      location: location ? location.trim() : location,
    };

    // If provider is approved, do not reset approval status or isApproved
    if (currentProvider.approvalStatus === 'approved') {
      // Only update allowed fields, keep approvalStatus and isApproved unchanged
      const updatedProvider = await Provider.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
      if (!updatedProvider) {
        return res.status(404).json({ message: 'Provider not found' });
      }
      console.log(`Profile updated for approved provider: ${updatedProvider._id}`);
      return res.json(updatedProvider);
    } else {
      // For non-approved providers, reset approval status to pending
      updateData.approvalStatus = 'pending';
      updateData.isApproved = false;
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedProvider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log(`Profile updated for provider: ${updatedProvider._id}`);
    res.json(updatedProvider);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
