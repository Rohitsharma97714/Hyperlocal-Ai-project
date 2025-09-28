import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['payment_pending', 'pending', 'approved', 'scheduled', 'in_progress', 'completed', 'reviewed', 'cancelled', 'rejected'],
    default: 'payment_pending'
  },
  notes: String,
  price: Number,
  location: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
