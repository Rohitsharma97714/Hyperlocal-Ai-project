import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getUserBookings, updateProfile, submitReview } from "../api/auth";
import { toast } from "react-toastify";

export default function UserDashboard() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [reviewStates, setReviewStates] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pageSize] = useState(10);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");

    console.log("Submitting profile update with data:", editForm);

    try {
      const response = await updateProfile(editForm);
      console.log("Profile update response:", response);
      console.log("Response data:", response.data);

      const updatedUser = {
        id: user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        role: user.role,
        token: response.data.token
      };
      console.log("Updated user object:", updatedUser);

      login(updatedUser);
      setIsEditing(false);
      // Update editForm state to reflect saved changes
      setEditForm({
        name: response.data.user.name,
        phone: response.data.user.phone,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);

      const errorMessage = error.response?.data?.message || "Failed to update profile";
      setProfileError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getUserBookings(currentPage, pageSize);
        // Handle paginated response
        if (response.data.bookings && Array.isArray(response.data.bookings)) {
          setBookings(response.data.bookings);
          setTotalPages(response.data.pagination.totalPages);
          setTotalBookings(response.data.pagination.totalBookings);
        } else {
          console.error('Bookings data is not in expected format:', response.data);
          setBookings([]);
          setTotalPages(1);
          setTotalBookings(0);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
        setTotalPages(1);
        setTotalBookings(0);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user, currentPage, pageSize]);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  // Fix: Include bookings with status 'reviewed' as completed
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'reviewed').length;

  const bookingCounts = {
    all: totalBookings,
    pending: pendingBookings,
    confirmed: confirmedBookings,
    completed: completedBookings
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}!</h1>
                <p className="text-blue-100 text-lg">Manage your account and explore our services</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
                activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
                activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
                activeTab === 'bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
                activeTab === 'actions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              Quick Actions
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setSelectedCard('total')}>
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings <span className="ml-2 bg-orange-600 text-white rounded-full px-2 py-1 text-xs font-medium">{totalBookings}</span></p>
                    <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setSelectedCard('pending')}>
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending <span className="ml-2 bg-orange-600 text-white rounded-full px-2 py-1 text-xs font-medium">{pendingBookings}</span></p>
                    <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setSelectedCard('confirmed')}>
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmed <span className="ml-2 bg-orange-600 text-white rounded-full px-2 py-1 text-xs font-medium">{confirmedBookings}</span></p>
                    <p className="text-2xl font-bold text-gray-900">{confirmedBookings}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setSelectedCard('completed')}>
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed <span className="ml-2 bg-orange-600 text-white rounded-full px-2 py-1 text-xs font-medium">{completedBookings}</span></p>
                    <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
                  </div>
                </div>
              </div>
            </div>
            {selectedCard && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedCard === 'total' ? 'All Bookings' : selectedCard.charAt(0).toUpperCase() + selectedCard.slice(1) + ' Bookings'}
                  </h3>
                  <button onClick={() => setSelectedCard(null)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  {bookings.filter(b => {
                    if (selectedCard === 'total') return true;
                    if (selectedCard === 'pending') return b.status === 'pending';
                    if (selectedCard === 'confirmed') return b.status === 'confirmed';
                    if (selectedCard === 'completed') return b.status === 'completed' || b.status === 'reviewed';
                  }).map((booking) => {
                    const reviewState = reviewStates[booking._id] || { rating: 0, comment: "", submitting: false, error: "" };
                    const hasReviewed = booking.reviews && booking.reviews.some(r => r.user === user.id);

                    const updateReviewState = (updates) => {
                      setReviewStates(prev => ({
                        ...prev,
                        [booking._id]: { ...prev[booking._id], ...updates }
                      }));
                    };

                    const handleReviewSubmit = async (e) => {
                      e.preventDefault();
                      if (reviewState.rating < 1 || reviewState.rating > 5) {
                        updateReviewState({ error: "Please provide a rating between 1 and 5." });
                        return;
                      }
                      if (!reviewState.comment.trim()) {
                        updateReviewState({ error: "Please provide a comment." });
                        return;
                      }
                      updateReviewState({ submitting: true, error: "" });
                      try {
                        await submitReview(booking._id, { rating: reviewState.rating, comment: reviewState.comment });
                        toast.success("Review submitted successfully!");
                        // Refresh bookings to show updated review status
                        const response = await getUserBookings();
                        if (Array.isArray(response.data)) {
                          setBookings(response.data);
                        }
                        // Clear review state after successful submission
                        updateReviewState({ rating: 0, comment: "", submitting: false, error: "" });
                      } catch (error) {
                        updateReviewState({ error: error.response?.data?.message || "Failed to submit review" });
                      } finally {
                        updateReviewState({ submitting: false });
                      }
                    };

                    return (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-purple-300">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-800 mb-2">
                              {booking.service?.name || 'Service'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p><span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}</p>
                              <p><span className="font-medium">Time:</span> {booking.time}</p>
                              <p><span className="font-medium">Location:</span> {booking.location || booking.service?.location}</p>
                              {booking.price && <p><span className="font-medium">Price:</span> ${booking.price}</p>}
                              <p><span className="font-medium">Provider:</span> {booking.provider?.name || 'N/A'}</p>
                            </div>
                            {booking.notes && (
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {booking.notes}
                              </p>
                            )}
                            {booking.status === 'completed' && !hasReviewed && (
                              <form onSubmit={handleReviewSubmit} className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <h5 className="font-semibold mb-2">Leave a Review</h5>
                                <label className="block mb-1 font-medium">Rating (1-5):</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={reviewState.rating}
                                  onChange={(e) => updateReviewState({ rating: Number(e.target.value) })}
                                  className="w-20 p-1 border border-gray-300 rounded"
                                  disabled={reviewState.submitting}
                                  required
                                />
                                <label className="block mt-2 mb-1 font-medium">Comment:</label>
                                <textarea
                                  value={reviewState.comment}
                                  onChange={(e) => updateReviewState({ comment: e.target.value })}
                                  className="w-full p-2 border border-gray-300 rounded"
                                  rows="3"
                                  disabled={reviewState.submitting}
                                  required
                                />
                                {reviewState.error && <p className="text-red-600 text-sm mt-1">{reviewState.error}</p>}
                                <button
                                  type="submit"
                                  disabled={reviewState.submitting}
                                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  {reviewState.submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                              </form>
                            )}
                            {booking.status === 'completed' && hasReviewed && (
                              <p className="mt-4 text-green-600 font-medium">Thank you for your review!</p>
                            )}
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-900">{user.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Phone:</span>
                <span className="text-gray-900">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Role:</span>
                <span className="text-gray-900 capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              My Bookings
            </h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading bookings...</p>
                </div>
              ) : bookings.length > 0 ? (
                bookings.map((booking) => {
                  const reviewState = reviewStates[booking._id] || { rating: 0, comment: "", submitting: false, error: "" };
                  const hasReviewed = booking.reviews && booking.reviews.some(r => r.user === user.id);

                  const updateReviewState = (updates) => {
                    setReviewStates(prev => ({
                      ...prev,
                      [booking._id]: { ...prev[booking._id], ...updates }
                    }));
                  };

                  const handleReviewSubmit = async (e) => {
                    e.preventDefault();
                    if (reviewState.rating < 1 || reviewState.rating > 5) {
                      updateReviewState({ error: "Please provide a rating between 1 and 5." });
                      return;
                    }
                    if (!reviewState.comment.trim()) {
                      updateReviewState({ error: "Please provide a comment." });
                      return;
                    }
                    updateReviewState({ submitting: true, error: "" });
                    try {
                      await submitReview(booking._id, { rating: reviewState.rating, comment: reviewState.comment });
                      toast.success("Review submitted successfully!");
                      // Refresh bookings to show updated review status
                      const response = await getUserBookings();
                      if (Array.isArray(response.data)) {
                        setBookings(response.data);
                      }
                      // Clear review state after successful submission
                      updateReviewState({ rating: 0, comment: "", submitting: false, error: "" });
                    } catch (error) {
                      updateReviewState({ error: error.response?.data?.message || "Failed to submit review" });
                    } finally {
                      updateReviewState({ submitting: false });
                    }
                  };

                  return (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-purple-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800 mb-2">
                            {booking.service?.name || 'Service'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <p><span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}</p>
                            <p><span className="font-medium">Time:</span> {booking.time}</p>
                            <p><span className="font-medium">Location:</span> {booking.location || booking.service?.location}</p>
                            {booking.price && <p><span className="font-medium">Price:</span> ${booking.price}</p>}
                            <p><span className="font-medium">Provider:</span> {booking.provider?.name || 'N/A'}</p>
                          </div>
                          {booking.notes && (
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {booking.notes}
                            </p>
                          )}
                          {booking.status === 'completed' && !hasReviewed && (
                            <form onSubmit={handleReviewSubmit} className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                              <h4 className="font-semibold mb-2">Leave a Review</h4>
                              <label className="block mb-1 font-medium">Rating (1-5):</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={reviewState.rating}
                                onChange={(e) => updateReviewState({ rating: Number(e.target.value) })}
                                className="w-20 p-1 border border-gray-300 rounded"
                                disabled={reviewState.submitting}
                                required
                              />
                              <label className="block mt-2 mb-1 font-medium">Comment:</label>
                              <textarea
                                value={reviewState.comment}
                                onChange={(e) => updateReviewState({ comment: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                                rows="3"
                                disabled={reviewState.submitting}
                                required
                              />
                              {reviewState.error && <p className="text-red-600 text-sm mt-1">{reviewState.error}</p>}
                              <button
                                type="submit"
                                disabled={reviewState.submitting}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                {reviewState.submitting ? 'Submitting...' : 'Submit Review'}
                              </button>
                            </form>
                          )}
                          {booking.status === 'completed' && hasReviewed && (
                            <p className="mt-4 text-green-600 font-medium">Thank you for your review!</p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No bookings yet</p>
                  <p className="text-sm mb-4">Your booking history will appear here</p>
                  <button
                    onClick={() => navigate('/services')}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Browse Services
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/forgot-password')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 hover:shadow-md group"
              >
                <div className="text-green-600 font-medium group-hover:scale-105 transition-transform">Change Password</div>
                <div className="text-sm text-gray-600">Secure your account</div>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:shadow-md group">
                <div className="text-purple-600 font-medium group-hover:scale-105 transition-transform">Support</div>
                <div className="text-sm text-gray-600">Get help</div>
              </button>
              <button
                onClick={() => navigate('/services')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-md group"
              >
                <div className="text-blue-600 font-medium group-hover:scale-105 transition-transform">Browse Services</div>
                <div className="text-sm text-gray-600">Find new services</div>
              </button>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </h2>
              {profileError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {profileError}
                </div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    disabled={profileLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    disabled={profileLoading}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {profileLoading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={profileLoading}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
