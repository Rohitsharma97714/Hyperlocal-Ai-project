import express from 'express';
import Provider from '../models/Provider.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';
import { sendApprovalEmail, sendRejectionEmail, sendServiceApprovalEmail, sendServiceRejectionEmail } from '../utils/sendEmail.js';

const router = express.Router();

// Get all pending providers for approval
router.get('/pending-providers', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const providers = await Provider.find({ approvalStatus: 'pending' })
      .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpires -tempPassword')
      .sort({ createdAt: -1 });

    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending services for approval
router.get('/pending-services', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const services = await Service.find({ status: 'pending' })
      .populate('provider', 'name email company')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved providers
router.get('/approved-providers', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const providers = await Provider.find({ approvalStatus: 'approved' })
      .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpires -tempPassword')
      .sort({ createdAt: -1 });

    res.json(providers);
  } catch (error) {
    console.error('Error fetching approved providers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved services
router.get('/approved-services', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const services = await Service.find({ status: 'approved' })
      .populate('provider', 'name email company')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Error fetching approved services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin stats
router.get('/stats', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalProviders = await Provider.countDocuments();
    const approvedProviders = await Provider.countDocuments({ approvalStatus: 'approved' });
    const pendingProviders = await Provider.countDocuments({ approvalStatus: 'pending' });

    const totalServices = await Service.countDocuments();
    const approvedServices = await Service.countDocuments({ status: 'approved' });
    const pendingServices = await Service.countDocuments({ status: 'pending' });

    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();

    res.json({
      totalProviders,
      approvedProviders,
      pendingProviders,
      totalServices,
      approvedServices,
      pendingServices,
      totalUsers,
      totalAdmins
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/rejected-providers', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const providers = await Provider.find({ approvalStatus: 'rejected' })
      .select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpires -tempPassword')
      .sort({ createdAt: -1 });

    res.json(providers);
  } catch (error) {
    console.error('Error fetching rejected providers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/rejected-services', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const services = await Service.find({ status: 'rejected' })
      .populate('provider', 'name email company')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Error fetching rejected services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update admin profile
router.put('/profile', protect(), async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Update admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Approve a provider
router.put('/providers/:id/approve', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const { adminNotes } = req.body;

    // Approve the provider
    provider.approvalStatus = 'approved';
    provider.isApproved = true;
    provider.adminNotes = adminNotes || '';
    await provider.save();

    // Send approval email notification
    await sendApprovalEmail(provider.email, provider.name, provider.adminNotes);

    res.json({ message: 'Provider approved successfully', provider });
  } catch (error) {
    console.error('Error approving provider:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject a provider
router.put('/providers/:id/reject', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const { adminNotes } = req.body;

    // Reject the provider
    provider.approvalStatus = 'rejected';
    provider.isApproved = false;
    provider.adminNotes = adminNotes || '';
    await provider.save();

    // Send rejection email notification
    await sendRejectionEmail(provider.email, provider.name, provider.adminNotes);

    res.json({ message: 'Provider rejected successfully', provider });
  } catch (error) {
    console.error('Error rejecting provider:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve a service
router.patch('/services/:id/status', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const service = await Service.findById(req.params.id).populate('provider', 'name email company');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    // Update service status
    service.status = status;
    service.adminNotes = adminNotes || '';
    await service.save();

    // Send email notification to provider
    if (status === 'approved') {
      await sendServiceApprovalEmail(service.provider.email, service.provider.name, service.name, service.adminNotes);
    } else if (status === 'rejected') {
      await sendServiceRejectionEmail(service.provider.email, service.provider.name, service.name, service.adminNotes);
    }

    res.json({
      message: `Service ${status} successfully`,
      service: {
        ...service.toObject(),
        provider: service.provider
      }
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

