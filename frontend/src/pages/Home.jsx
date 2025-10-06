import React from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../data/predefinedServices";

export default function Home() {
  const navigate = useNavigate();
  const categories = getCategories();

  // Function to get icon based on category
  const getIcon = (category) => {
    const iconMap = {
      Plumbing: "🔧",
      Electrical: "⚡",
      Cleaning: "🧹",
      Gardening: "🌱",
      Painting: "🎨",
      Carpentry: "🔨",
      Automotive: "🚗",
      "Home Repair": "🏠",
      Tutoring: "📚",
      Fitness: "💪",
      Beauty: "💄",
      Catering: "🍽️",
      Photography: "📷",
      "Event Planning": "🎉",
      "Pet Care": "🐾",
      Other: "🔧",
    };
    return iconMap[category] || "🔧";
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="pt-16 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-snug sm:leading-normal">
            Connecting Communities with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Discover local vendors, products, and services powered by
            intelligent search and personalized recommendations. Your
            neighborhood, smarter.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/register"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-md"
            >
              Get Started Free
            </a>
            <a
              href="/services"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-white text-blue-600 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-50 border-2 border-blue-600 transform hover:scale-105 transition-all duration-300 shadow-md"
            >
              Explore Services
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-10 sm:mb-16">
            Why Choose HyperLocal AI?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: "🔍",
                title: "AI-Powered Search",
                desc: "Find vendors and products near you instantly with our advanced AI algorithms that understand your needs.",
              },
              {
                icon: "✅",
                title: "Verified Vendors",
                desc: "All vendors are thoroughly verified to ensure quality, trustworthiness, and reliable service delivery.",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Experience seamless, fast, and user-friendly interface optimized for both mobile and desktop devices.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="text-4xl sm:text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-10 sm:mb-16">
            Our Services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
            {categories.map((category) => (
              <div
                key={category}
                onClick={() => navigate(`/services?category=${encodeURIComponent(category)}`)}
                className="cursor-pointer bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center"
              >
                <div className="text-5xl mb-4">{getIcon(category)}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
                  {category}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">10K+</div>
              <div className="text-blue-100 text-sm sm:text-base">Active Users</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">5K+</div>
              <div className="text-blue-100 text-sm sm:text-base">Verified Vendors</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">50K+</div>
              <div className="text-blue-100 text-sm sm:text-base">Services Completed</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">4.9</div>
              <div className="text-blue-100 text-sm sm:text-base">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Discover Your Local Heroes?
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10">
            Join thousands of satisfied users and start exploring local services today.
          </p>
          <a
            href="/register"
            className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold text-base sm:text-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-md"
          >
            Join Now
          </a>
        </div>
      </section>
    </div>
  );
}
