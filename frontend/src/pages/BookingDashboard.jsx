import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBookings(data);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, paymentStatus) => {
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (status === 'confirmed') return 'bg-green-100 text-green-800';
    if (status === 'scheduled') return 'bg-yellow-100 text-yellow-800';
    if (status === 'payment_pending') {
      if (paymentStatus === 'paid') return 'bg-green-100 text-green-800';
      if (paymentStatus === 'failed') return 'bg-red-100 text-red-800';
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status, paymentStatus) => {
    if (status === 'payment_pending') {
      if (paymentStatus === 'paid') return 'Payment Completed';
      if (paymentStatus === 'failed') return 'Payment Failed';
      return 'Payment Pending';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your service bookings</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Bookings Found</h2>
            <p className="text-gray-600 mb-6">You haven't made any bookings yet.</p>
            <button
              onClick={() => navigate('/services')}
              className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {booking.service?.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status, booking.paymentStatus)}`}>
                        {getStatusText(booking.status, booking.paymentStatus)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium text-gray-800">Provider</p>
                        <p>{booking.provider?.name || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">Date & Time</p>
                        <p>{new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">Price</p>
                        <p className="text-teal-600 font-semibold">₹{booking.price}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4">
                        <p className="font-medium text-gray-800 text-sm">Notes</p>
                        <p className="text-gray-600 text-sm">{booking.notes}</p>
                      </div>
                    )}

                    {booking.paymentStatus && (
                      <div className="mt-4">
                        <p className="font-medium text-gray-800 text-sm">Payment Status</p>
                        <p className={`text-sm font-medium ${
                          booking.paymentStatus === 'paid' ? 'text-green-600' :
                          booking.paymentStatus === 'failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6">
                    {booking.status === 'confirmed' && (
                      <button
                        className="w-full md:w-auto bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm"
                        onClick={() => {/* Add view details functionality */}}
                      >
                        View Details
                      </button>
                    )}

                    {booking.status === 'payment_pending' && booking.paymentStatus === 'pending' && (
                      <button
                        className="w-full md:w-auto bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
                        onClick={() => navigate('/payment-summary')}
                      >
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDashboard;
