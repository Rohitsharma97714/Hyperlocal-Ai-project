import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  duration: { type: String, required: true }, // e.g., "1 hour", "30 minutes"
  availability: {
    type: [String], // e.g., ["monday", "tuesday", "wednesday"]
    default: []
  },
  images: [{ type: String }], // Array of image URLs
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: String, // Admin notes for approval/rejection
  tags: [{ type: String }], // Service tags for better search
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Index for better search performance
serviceSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.model('Service', serviceSchema);
