import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { AuthContext } from "../context/AuthContext";
import { getServices, createService, updateService, deleteService, getProviderBookings, updateBookingStatus, cancelBooking } from "../api/auth";
import { predefinedServices, getCategories } from "../data/predefinedServices";
import { updateProfile, getProfile } from "../api/provider";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ProviderDashboard() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "profile";
  });
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return searchParams.get("subTab") || "pending";
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    location: ""
  });
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [providerProfile, setProviderProfile] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filter services by status
  const pendingServices = services.filter(service => service.status === 'pending');
  const approvedServices = services.filter(service => service.status === 'approved');
  const rejectedServices = services.filter(service => service.status === 'rejected');

  // Filter bookings by status
  const pendingBookings = bookings.filter(booking => booking.status === 'pending' || booking.status === 'payment_pending');
  const approvedBookings = bookings.filter(booking => booking.status === 'approved');
  const scheduledBookings = bookings.filter(booking => booking.status === 'scheduled');
  const inProgressBookings = bookings.filter(booking => booking.status === 'in_progress');
  const completedBookings = bookings.filter(booking => booking.status === 'completed');

  useEffect(() => {
    loadServices();
    loadBookings();
    loadProfile();

    socket.on("bookingStatusUpdated", (updatedBooking) => {
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === updatedBooking._id ? updatedBooking : booking
        )
      );
    });

    return () => {
      socket.off("bookingStatusUpdated");
    };
  }, []);

  useEffect(() => {
    if (providerProfile) {
      setProfileForm({
        name: providerProfile.name || "",
        email: providerProfile.email || "",
        phone: providerProfile.phone || "",
        location: providerProfile.location || ""
      });
    }
  }, [providerProfile]);

  // Sync URL params with state
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (activeTab !== "profile") {
      newParams.set("tab", activeTab);
    }
    if (activeSubTab !== "pending") {
      newParams.set("subTab", activeSubTab);
    }
    setSearchParams(newParams, { replace: true });
  }, [activeTab, activeSubTab, setSearchParams]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await getServices(user.id);
      if (response.data && Array.isArray(response.data)) {
        setServices(response.data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await getProviderBookings();
      if (response.data && Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await getProfile();
      if (response.data) {
        setProviderProfile(response.data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare form data with custom category if "Other" is selected
    const submitData = {
      ...formData,
      category: formData.category === "Other" ? customCategory : formData.category,
      duration: formData.duration + " hour"
    };

    try {
      if (editingService) {
        await updateService(editingService._id, submitData);
      } else {
        await createService(submitData);
      }

      await loadServices();
      setShowAddModal(false);
      setEditingService(null);
      resetForm();
      toast.success(editingService ? "Service updated successfully!" : "Service created successfully!");
    } catch (error) {
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
        toast.error(error.response?.data?.message || "Error saving service");
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error("No response from server. Check network connection.");
      } else {
        console.error('Axios config error:', error.message);
        toast.error("Request configuration error.");
      }
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    const predefinedCats = getCategories();
    const isPredefined = predefinedCats.includes(service.category);

    setFormData({
      name: service.name,
      description: service.description,
      category: isPredefined ? service.category : "Other",
      price: service.price,
      duration: service.duration,
      location: service.location
    });

    if (!isPredefined) {
      setCustomCategory(service.category);
      setShowCustomCategoryInput(true);
    } else {
      setCustomCategory("");
      setShowCustomCategoryInput(false);
    }

    setShowAddModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(serviceId);
        await loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error deleting service");
    }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      duration: "",
      location: ""
    });
    setCustomCategory("");
    setShowCustomCategoryInput(false);
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    console.log("🔄 handleBookingStatusUpdate called with:", { bookingId, newStatus });

    try {
      console.log("📡 Making API call to updateBookingStatus...");
      const response = await updateBookingStatus(bookingId, newStatus);
      console.log("✅ API call successful:", response);

      console.log("🔄 Reloading bookings...");
      await loadBookings();
      console.log("✅ Bookings reloaded successfully");

      toast.success("Booking status updated successfully");

    } catch (error) {
      console.error("❌ Error updating booking status:", error);

      if (error.response) {
        console.error("📊 Server responded with error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error("🌐 No response received:", error.request);
      } else {
        console.error("⚙️ Request setup error:", error.message);
      }

      toast.error("Error updating booking status");
    }
  };

  const handleRejectBooking = async (e) => {
    e.preventDefault();

    if (!rejectingBookingId || !rejectNote.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      console.log("📡 Making API call to reject booking...");
      const response = await updateBookingStatus(rejectingBookingId, "rejected", rejectNote.trim());
      console.log("✅ Booking rejection successful:", response);

      console.log("🔄 Reloading bookings...");
      await loadBookings();
      console.log("✅ Bookings reloaded successfully");

      // Close modal and reset state
      setShowRejectModal(false);
      setRejectNote("");
      setRejectingBookingId(null);

      toast.success("Booking rejected successfully");

    } catch (error) {
      console.error("❌ Error rejecting booking:", error);

      if (error.response) {
        console.error("📊 Server responded with error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error("🌐 No response received:", error.request);
      } else {
        console.error("⚙️ Request setup error:", error.message);
      }

      toast.error("Error rejecting booking");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateProfile(profileForm);
      if (response.data) {
        // Reload profile data
        await loadProfile();
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Provider Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your services and track your bookings
          </p>
        </div>

        {/* Main Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
            {["profile", "services", "bookings"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setActiveSubTab(tab === "services" ? "pending" : tab === "bookings" ? "pending" : "pending");
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Add Service Button - Only show for services tab */}
        {activeTab === "services" && (
          <div className="mb-6">
            <button
              onClick={() => {
                setEditingService(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Service
            </button>
          </div>
        )}

        {/* Sub Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <nav className="-mb-px flex space-x-8" aria-label="Sub Tabs">
            {activeTab === "services" ? (
              ["pending", "approved", "rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSubTab === tab
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Services
                </button>
              ))
            ) : activeTab === "bookings" ? (
              ["pending", "approved", "scheduled", "in_progress", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSubTab === tab
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Bookings
                </button>
              ))
            ) : null}
          </nav>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
            </div>
          ) : activeTab === "profile" ? (
            /* Profile Content */
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Provider Profile</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {isEditing ? (
                  /* Edit Profile Form */
                  <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                      {/* Profile Header */}
                      <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                          {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Edit Your Profile</h3>
                        <p className="text-gray-600">Update your personal information</p>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Full Name
                            </span>
                          </label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email Address
                            </span>
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your email"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Phone Number
                            </span>
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Location
                            </span>
                          </label>
                          <input
                            type="text"
                            value={profileForm.location}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your location"
                            required
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center space-x-4 pt-6">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Profile Display */
                  <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="text-center mb-8">
                      <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                        {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : "P"}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">{profileForm.name || "Provider"}</h3>
                      <p className="text-gray-600">Service Provider</p>
                    </div>

                    {/* Profile Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="text-gray-800 font-medium">{profileForm.name || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="text-gray-800 font-medium">{profileForm.email || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="text-gray-800 font-medium">{profileForm.phone || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="text-gray-800 font-medium">{profileForm.location || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Status Card */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800">Account Status</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Account Type</p>
                              <p className="text-gray-800 font-medium">Service Provider</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Approval Status</p>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                providerProfile?.isApproved === true
                                  ? "bg-green-100 text-green-800"
                                  : providerProfile?.isApproved === false
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {providerProfile?.isApproved === true
                                  ? "✅ Approved"
                                  : providerProfile?.isApproved === false
                                  ? "❌ Rejected"
                                  : "⏳ Pending Approval"
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Member Since</p>
                              <p className="text-gray-800 font-medium">
                                {providerProfile?.createdAt ? new Date(providerProfile.createdAt).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">Total Services</p>
                              <p className="text-gray-800 font-medium">{services.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "services" ? (
            /* Services List */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeSubTab === "pending" ? pendingServices : activeSubTab === "approved" ? approvedServices : rejectedServices).length === 0 ? (
                <div className="col-span-full text-center text-gray-600 text-lg py-12">
                  No {activeSubTab} services
                </div>
              ) : (
                (activeSubTab === "pending" ? pendingServices : activeSubTab === "approved" ? approvedServices : rejectedServices).map((service) => (
                  <div
                    key={service._id}
                    className={`bg-gradient-to-r ${
                      activeSubTab === "pending"
                        ? "from-yellow-50 to-orange-50 border-yellow-200"
                        : activeSubTab === "approved"
                        ? "from-green-50 to-emerald-50 border-green-200"
                        : "from-red-50 to-pink-50 border-red-200"
                    } border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              activeSubTab === "pending"
                                ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                                : activeSubTab === "approved"
                                ? "bg-gradient-to-r from-green-400 to-emerald-400"
                                : "bg-gradient-to-r from-red-400 to-pink-400"
                            }`}
                          >
                            {service.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3
                              className={`font-bold ${
                                activeSubTab === "pending"
                                  ? "text-yellow-900"
                                  : activeSubTab === "approved"
                                  ? "text-green-900"
                                  : "text-red-900"
                              }`}
                            >
                              {service.name}
                            </h3>
                            <p
                              className={`text-sm ${
                                activeSubTab === "pending"
                                  ? "text-yellow-700"
                                  : activeSubTab === "approved"
                                  ? "text-green-700"
                                  : "text-red-700"
                              } line-clamp-1`}
                            >
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mb-1">
                          <p
                            className={`text-sm ${
                              activeSubTab === "pending"
                                ? "text-yellow-700"
                                : activeSubTab === "approved"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            💰 ${service.price}
                          </p>
                          <p className="text-sm text-gray-700">📍 {service.location}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          📅 Created: {new Date(service.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className={`text-sm font-semibold ${
                            activeSubTab === "pending"
                              ? "text-yellow-600 hover:text-yellow-900"
                              : activeSubTab === "approved"
                              ? "text-green-600 hover:text-green-900"
                              : "text-red-600 hover:text-red-900"
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="text-sm font-semibold text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Bookings List */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeSubTab === "pending" ? pendingBookings : activeSubTab === "approved" ? approvedBookings : activeSubTab === "scheduled" ? scheduledBookings : activeSubTab === "in_progress" ? inProgressBookings : completedBookings).length === 0 ? (
                <div className="col-span-full text-center text-gray-600 text-lg py-12">
                  No {activeSubTab} bookings
                </div>
              ) : (
                (activeSubTab === "pending" ? pendingBookings : activeSubTab === "approved" ? approvedBookings : activeSubTab === "scheduled" ? scheduledBookings : activeSubTab === "in_progress" ? inProgressBookings : completedBookings).map((booking) => (
                  <div
                    key={booking._id}
                    className={`bg-gradient-to-r ${
                      activeSubTab === "pending"
                        ? "from-yellow-50 to-orange-50 border-yellow-200"
                        : activeSubTab === "approved"
                        ? "from-green-50 to-emerald-50 border-green-200"
                        : activeSubTab === "scheduled"
                        ? "from-blue-50 to-indigo-50 border-blue-200"
                        : activeSubTab === "in_progress"
                        ? "from-purple-50 to-pink-50 border-purple-200"
                        : "from-green-50 to-emerald-50 border-green-200"
                    } border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              activeSubTab === "pending"
                                ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                                : activeSubTab === "approved"
                                ? "bg-gradient-to-r from-green-400 to-emerald-400"
                                : activeSubTab === "scheduled"
                                ? "bg-gradient-to-r from-blue-400 to-indigo-400"
                                : activeSubTab === "in_progress"
                                ? "bg-gradient-to-r from-purple-400 to-pink-400"
                                : "bg-gradient-to-r from-green-400 to-emerald-400"
                            }`}
                          >
                            {booking.service?.name?.charAt(0).toUpperCase() || "B"}
                          </div>
                          <div>
                            <h3
                              className={`font-bold ${
                                activeSubTab === "pending"
                                  ? "text-yellow-900"
                                  : activeSubTab === "approved"
                                  ? "text-green-900"
                                  : activeSubTab === "scheduled"
                                  ? "text-blue-900"
                                  : activeSubTab === "in_progress"
                                  ? "text-purple-900"
                                  : "text-green-900"
                              }`}
                            >
                              {booking.service?.name || "Service"}
                            </h3>
                            <p
                              className={`text-sm ${
                                activeSubTab === "pending"
                                  ? "text-yellow-700"
                                  : activeSubTab === "approved"
                                  ? "text-green-700"
                                  : activeSubTab === "scheduled"
                                  ? "text-blue-700"
                                  : activeSubTab === "in_progress"
                                  ? "text-purple-700"
                                  : "text-green-700"
                              }`}
                            >
                              Customer: {booking.user?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mb-1">
                          <p
                            className={`text-sm ${
                              activeSubTab === "pending"
                                ? "text-yellow-700"
                                : activeSubTab === "approved"
                                ? "text-green-700"
                                : activeSubTab === "scheduled"
                                ? "text-blue-700"
                                : activeSubTab === "in_progress"
                                ? "text-purple-700"
                                : "text-green-700"
                            }`}
                          >
                            💰 ${booking.service?.price || "0"}
                          </p>
                          <p className="text-sm text-gray-700">📍 {booking.location || "N/A"}</p>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          📅 {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                        {booking.scheduledDate && (
                          <p className="text-xs text-gray-500">
                            🕒 Scheduled: {new Date(booking.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        {activeSubTab === "pending" && (
                          <>
                            <button
                              onClick={() => handleBookingStatusUpdate(booking._id, "approved")}
                              className="text-sm font-semibold text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingBookingId(booking._id);
                                setShowRejectModal(true);
                              }}
                              className="text-sm font-semibold text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {activeSubTab === "approved" && (
                          <button
                            onClick={() => handleBookingStatusUpdate(booking._id, "scheduled")}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-900"
                          >
                            Schedule
                          </button>
                        )}
                        {activeSubTab === "scheduled" && (
                          <button
                            onClick={() => handleBookingStatusUpdate(booking._id, "in_progress")}
                            className="text-sm font-semibold text-purple-600 hover:text-purple-900"
                          >
                            Start Service
                          </button>
                        )}
                        {activeSubTab === "in_progress" && (
                          <button
                            onClick={() => handleBookingStatusUpdate(booking._id, "completed")}
                            className="text-sm font-semibold text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Service Details Modal */}
          {selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
                <div className="space-y-4">
                  <p><strong>Name:</strong> {selectedBooking.service?.name}</p>
                  <p><strong>Category:</strong> {selectedBooking.service?.category}</p>
                  <p><strong>Description:</strong> {selectedBooking.service?.description || "N/A"}</p>
                  <p><strong>Price:</strong> ${selectedBooking.service?.price}</p>
                  <p><strong>Duration:</strong> {selectedBooking.service?.duration}</p>
                  <p><strong>Location:</strong> {selectedBooking.location || "N/A"}</p>
                  <p><strong>Booking Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</p>
                  <p><strong>Booking Time:</strong> {selectedBooking.time}</p>
                  <p><strong>Status:</strong> {selectedBooking.status}</p>
                  {selectedBooking.notes && <p><strong>Notes:</strong> {selectedBooking.notes}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reject Booking Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reject Booking</h2>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this booking:</p>

              <form onSubmit={handleRejectBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="4"
                    placeholder="Enter the reason for rejection..."
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectNote("");
                      setRejectingBookingId(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Reject Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Service Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, category: value }));
                      if (value === "Other") {
                        setShowCustomCategoryInput(true);
                      } else {
                        setShowCustomCategoryInput(false);
                        setCustomCategory("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {getCategories().map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  {showCustomCategoryInput && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter custom category"
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 1"
                        className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min="1"
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        hour
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Service location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingService(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
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
