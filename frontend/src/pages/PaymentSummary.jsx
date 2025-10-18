import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupRazorpayConsoleSuppression, injectRazorpayCSSFix, createRazorpayOptions } from '../utils/razorpayUtils';

const PaymentSummary = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      setBookingData(JSON.parse(pendingBooking));
    } else {
      navigate('/services');
    }
  }, [navigate]);

  const handlePayment = async () => {
    if (!bookingData) return;

    setLoading(true);
    setError('');

    // Setup console suppression and CSS injection
    const consoleSuppression = setupRazorpayConsoleSuppression();
    const cssInjection = injectRazorpayCSSFix();

    try {
      console.log('Creating payment order for:', bookingData);
      // Step 1: Create Razorpay order
      const orderRes = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          serviceId: bookingData.serviceId,
          date: bookingData.date,
          time: bookingData.time,
          notes: bookingData.notes
        })
      });

      console.log('Order response status:', orderRes.status);
      const orderData = await orderRes.json();
      console.log('Order response data:', orderData);

      if (!orderRes.ok) {
        console.error('Order creation failed:', orderData);
        setError(orderData.message || 'Failed to create payment order. Please try again.');
        setLoading(false);
        return;
      }

      const { order } = orderData;

      if (!order || !order.id) {
        console.error('Order object missing or invalid:', order);
        setError('Failed to create payment order. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Order created successfully:', order);

      // Step 2: Open Razorpay checkout
      const options = createRazorpayOptions(
        order,
        bookingData,
        async function (razorpayResponse) {
          try {
            // Step 3: Verify payment and create booking
            const verifyRes = await fetch('http://localhost:5000/api/bookings/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                date: bookingData.date,
                time: bookingData.time,
                notes: bookingData.notes
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              // Clear pending booking data
              localStorage.removeItem('pendingBooking');
              // Redirect to dashboard
              navigate('/dashboard');
            } else {
              setError(verifyData.message || 'Payment verification failed. Please contact support.');
            }
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
          } finally {
            // Cleanup after payment completion
            consoleSuppression.restore();
            cssInjection.remove();
          }
        },
        function () {
          // Cleanup when modal is dismissed
          consoleSuppression.restore();
          cssInjection.remove();
        }
      );

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      setError('Failed to initiate payment. Please try again.');
      // Cleanup on error
      consoleSuppression.restore();
      cssInjection.remove();
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Payment Summary</h1>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Service:</span>
              <span className="text-gray-900">{bookingData.serviceName}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Provider:</span>
              <span className="text-gray-900">{bookingData.providerName}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Date:</span>
              <span className="text-gray-900">{new Date(bookingData.date).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">Time:</span>
              <span className="text-gray-900">{bookingData.time}</span>
            </div>

            {bookingData.notes && (
              <div className="flex justify-between items-start py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Notes:</span>
                <span className="text-gray-900 text-right">{bookingData.notes}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-4 border-t-2 border-gray-300">
              <span className="text-xl font-bold text-gray-800">Total Amount:</span>
              <span className="text-xl font-bold text-teal-600">₹{bookingData.price}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/services')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Back to Services
            </button>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Make Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
