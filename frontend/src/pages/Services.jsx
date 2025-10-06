
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getServices } from "../api/auth";
import { getCategories } from "../data/predefinedServices";
import BookingForm from "../components/BookingForm";
import ServiceSummary from "../components/ServiceSummary";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Services() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSummaryService, setSelectedSummaryService] = useState(null);

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);

        const response = await getServices();
        let filteredServices = response.data;

        // Client-side filtering if needed (backend already supports it)
        if (searchTerm || selectedCategory || selectedLocation) {
          filteredServices = response.data.filter(service => {
            const matchesSearch = !searchTerm ||
              service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.category.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = !selectedCategory || service.category === selectedCategory;
            const matchesLocation = !selectedLocation || service.location === selectedLocation;

            return matchesSearch && matchesCategory && matchesLocation;
          });
        }

        // Extract unique locations from all services (before final filter for complete list)
        const allLocations = [...new Set(response.data.map(s => s.location).filter(Boolean))];
        setLocations(allLocations);

        setServices(filteredServices);
      } catch (err) {
        setError("Failed to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchTerm, selectedCategory, selectedLocation]);

  // Function to update review count locally after a new review is submitted
  const updateReviewCount = (serviceId, newRating) => {
    setServices((prevServices) =>
      prevServices.map((service) => {
        if (service._id === serviceId) {
          const currentCount = service.reviewCount || 0;
          const currentRating = service.rating || 0;
          const newCount = currentCount + 1;
          const newAverageRating = calculateNewRating(currentRating, currentCount, newRating);

          return {
            ...service,
            reviewCount: newCount,
            rating: newAverageRating,
          };
        }
        return service;
      })
    );
  };

  // Helper function to calculate new average rating
  const calculateNewRating = (currentRating, currentCount, newRating) => {
    const totalRating = (currentRating || 0) * (currentCount || 0);
    const newCount = (currentCount || 0) + 1;
    return ((totalRating + newRating) / newCount);
  };

  // Listen for booking form open event
  useEffect(() => {
    const handleOpenBookingForm = (event) => {
      setSelectedService(event.detail);
      setShowBookingForm(true);
    };

    window.addEventListener('openBookingForm', handleOpenBookingForm);

    return () => {
      window.removeEventListener('openBookingForm', handleOpenBookingForm);
    };
  }, []);

  const handleCloseBookingForm = () => {
    setShowBookingForm(false);
    setSelectedService(null);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setSelectedSummaryService(null);
  };

  // Function to get icon based on category
  const getIcon = (category) => {
    const iconMap = {
      'Plumbing': '🔧',
      'Electrical': '⚡',
      'Cleaning': '🧹',
      'Gardening': '🌱',
      'Painting': '🎨',
      'Carpentry': '🔨',
      'Automotive': '🚗',
      'Home Repair': '🏠',
      'Tutoring': '📚',
      'Fitness': '💪',
      'Beauty': '💄',
      'Catering': '🍽️',
      'Photography': '📷',
      'Event Planning': '🎉',
      'Pet Care': '🐾',
      'Other': '🔧'
    };
    return iconMap[category] || '🔧';
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              Local Services
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Discover and book services from verified local providers
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search for services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                <option value="Other">Other (Add New Service)</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  // Trigger re-fetch with current filters
                  setSearchTerm(searchTerm);
                  setSelectedCategory(selectedCategory);
                  setSelectedLocation(selectedLocation);
                }}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors duration-200 text-sm sm:text-base"
              >
                Search
              </button>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No services found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedSummaryService(service);
                    setShowSummary(true);
                  }}
                >
                  <div className="text-4xl mb-4 text-center">{getIcon(service.category)}</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-2 text-center">{service.provider?.name || "Unknown Provider"}</p>
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="font-semibold">{service.rating?.toFixed(1) || "N/A"}</span>
                    <span className="ml-4 text-gray-600">({service.reviewCount || 0} reviews)</span>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base mb-2 text-center line-clamp-2">{service.description}</p>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 text-center"><strong>Location:</strong> {service.location || "N/A"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-teal-600 font-bold text-lg sm:text-xl">${service.price}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          toast.info("Please log in first");
                          return;
                        }
                        // Open BookingForm modal instead of navigating
                        const event = new CustomEvent('openBookingForm', { detail: service });
                        window.dispatchEvent(event);
                      }}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm sm:text-base"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Can't find what you're looking for?
            </p>
            <button
              onClick={() => toast.info("Request a Service feature coming soon!")}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 text-sm sm:text-base"
            >
              Request a Service
            </button>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedService && (
        <BookingForm
          service={selectedService}
          onClose={handleCloseBookingForm}
        />
      )}

      {/* Service Summary Modal */}
      {showSummary && selectedSummaryService && (
        <ServiceSummary
          service={selectedSummaryService}
          onClose={handleCloseSummary}
          onReviewSubmit={updateReviewCount}
        />
      )}
    </>
  );
}
