import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function ServiceSummary({ service, onClose, onReviewSubmit }) {
  const { user } = useContext(AuthContext);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!service) return null;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to submit a review');
        return;
      }

      // Find a completed booking for this service by the current user
      const bookingResponse = await fetch(`http://localhost:5000/api/bookings/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!bookingResponse.ok) {
        setError('Failed to verify booking');
        return;
      }

      const bookings = await bookingResponse.json();
      const completedBooking = bookings.find(b =>
        b.service._id === service._id && (b.status.toLowerCase() === 'completed' || b.status.toLowerCase() === 'reviewed')
      );

      if (!completedBooking) {
        setError('You can only review services you have completed');
        return;
      }

      // Submit the review
      const reviewResponse = await fetch(`http://localhost:5000/api/bookings/${completedBooking._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (!reviewResponse.ok) {
        const errorData = await reviewResponse.json();
        setError(errorData.message || 'Failed to submit review');
        return;
      }

      // Update the review count locally
      if (onReviewSubmit) {
        onReviewSubmit(service._id, reviewData.rating);
      }

      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
      alert('Review submitted successfully!');
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
        <p className="text-gray-700 mb-4">{service.description}</p>
        <div className="mb-2">
          <strong>Provider:</strong> {service.provider?.name || 'Unknown Provider'}
        </div>
        <div className="mb-2">
          <strong>Location:</strong> {service.location || 'N/A'}
        </div>
        <div className="mb-2 flex items-center">
          <strong>Rating:</strong>
          <span className="ml-2 text-yellow-500">⭐</span>
          <span className="ml-1 font-semibold">{service.rating?.toFixed(1) || 'N/A'}</span>
          <span className="ml-2 text-gray-600">({service.reviewCount || 0} reviews)</span>
        </div>
        <div className="mb-2">
          <strong>Price:</strong> ${service.price}
        </div>
        <div className="mb-2">
          <strong>Duration:</strong> {service.duration}
        </div>
        <div className="mb-2">
          <strong>Availability:</strong> {service.availability && service.availability.length > 0 ? service.availability.join(', ') : 'Not specified'}
        </div>

        <div className="mt-6 flex gap-4">
          {user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              {showReviewForm ? 'Cancel Review' : 'Write Review'}
            </button>
          )}
          <button
            onClick={() => {
              if (!user) {
                alert('Please login to continue');
                // Navigate to login
                window.location.href = '/login';
                return;
              }
              const event = new CustomEvent('openBookingForm', { detail: service });
              window.dispatchEvent(event);
              onClose();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Book Now
          </button>
        </div>

        {showReviewForm && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1-5 stars)
                </label>
                <select
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({...reviewData, rating: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                  <option value={3}>⭐⭐⭐ (3 stars)</option>
                  <option value={2}>⭐⭐ (2 stars)</option>
                  <option value={1}>⭐ (1 star)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                  rows="4"
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
