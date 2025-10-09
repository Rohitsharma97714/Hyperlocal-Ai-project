import express from 'express';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
import { protect } from '../middleware/auth.js';
import { sendServiceApprovalEmail, sendServiceRejectionEmail } from '../utils/sendEmail.js';

const router = express.Router();

// Get unique categories from approved services (public, no auth)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.distinct('category', { status: 'approved' });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved services (public)
router.get('/public', async (req, res) => {
  try {
    const { category, location, search } = req.query;
    let query = { status: 'approved' };

    if (category) query.category = new RegExp(category, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    const services = await Service.find(query)
      .populate('provider', 'name company rating')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get services by provider (for provider dashboard)
router.get('/provider/:providerId', protect(['provider', 'admin']), async (req, res) => {
  try {
    const { providerId } = req.params;

    // Check if user is the provider or admin
    if (req.user.role !== 'admin' && req.user.id.toString() !== providerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const services = await Service.find({ provider: providerId })
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending services for admin approval
router.get('/pending', protect(['admin']), async (req, res) => {
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

// Create new service (providers only)
router.post('/', protect(), async (req, res) => {
  try {
    console.log('POST /services - User:', req.user);
    console.log('POST /services - Body:', req.body);

    if (req.user.role !== 'provider') {
      console.log('POST /services - Access denied: not provider');
      return res.status(403).json({ message: 'Provider access required' });
    }

    // Get provider to check approval status
    const provider = await Provider.findById(req.user.id);
    if (!provider) {
      console.log('POST /services - Provider not found');
      return res.status(404).json({ message: 'Provider not found' });
    }

    const serviceData = {
      ...req.body,
      provider: req.user.id,
      status: 'pending'
    };

    console.log('POST /services - Service data:', serviceData);

    const service = new Service(serviceData);
    await service.save();

    // Add service to provider's services array
    await Provider.findByIdAndUpdate(req.user.id, {
      $push: { services: service._id }
    });

    console.log('POST /services - Service created successfully');
    res.status(201).json(service);
  } catch (error) {
    console.log('POST /services - Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service (provider can update their own, admin can update any)
router.put('/:id', protect(), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If provider is updating, keep approved status if service was approved, else set to pending
    if (req.user.role === 'provider') {
      if (service.status === 'approved') {
        req.body.status = 'approved';
      } else {
        req.body.status = 'pending';
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject service (admin only)
router.patch('/:id/status', protect(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If rejecting, delete the service from database
    if (status === 'rejected') {
      const service = await Service.findById(req.params.id).populate('provider', 'name email');

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Send rejection email before deleting
      let emailSent = false;
      try {
        console.log('📧 Sending service rejection email to:', service.provider.email);
        await sendServiceRejectionEmail(service.provider.email, service.provider.name, service.name, adminNotes);
        console.log('✅ Service rejection email sent successfully');
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Error sending service rejection email:', emailError.message);
        console.error('Email details:', { to: service.provider.email, serviceName: service.name });
        // Continue with deletion even if email fails
      }

      // Remove service from provider's services array
      await Provider.findByIdAndUpdate(service.provider._id, {
        $pull: { services: service._id }
      });

      // Delete the service from database
      await Service.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Service rejected and deleted successfully',
        emailSent
      });
    } else {
      // For approval, update the status
      const service = await Service.findByIdAndUpdate(
        req.params.id,
        { status, adminNotes },
        { new: true }
      ).populate('provider', 'name email');

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Send approval email
      let emailSent = false;
      try {
        console.log('📧 Sending service approval email to:', service.provider.email);
        await sendServiceApprovalEmail(service.provider.email, service.provider.name, service.name, adminNotes);
        console.log('✅ Service approval email sent successfully');
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Error sending service approval email:', emailError.message);
        console.error('Email details:', { to: service.provider.email, serviceName: service.name });
        // Do not fail the request if email sending fails
      }

      res.json({
        ...service.toObject(),
        emailSent
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete service
router.delete('/:id', protect(), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Service.findByIdAndDelete(req.params.id);

    // Remove service from provider's services array
    await Provider.findByIdAndUpdate(service.provider, {
      $pull: { services: req.params.id }
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved services (public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ status: 'approved' })
      .populate('provider', 'name company rating')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name company rating phone');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
