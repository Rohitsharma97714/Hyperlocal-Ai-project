import { useState } from 'react';
import { toast } from 'react-toastify';
import { register } from '../api/auth';

export default function Register() {
  const [role, setRole] = useState('user'); // default role
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    company: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await register(role, formData); // Use the dynamic register function
      console.log(response.data);
      // Navigate to VerifyOtp page with role and id
      window.location.href = `/verify-otp?role=${role}&id=${response.data.id}`;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-md border border-gray-200">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Join HyperLocal AI
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Create your account and get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              I want to register as
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            >
              <option value="user">👤 User</option>
              <option value="provider">🏢 Service Provider</option>
              <option value="admin">⚙️ Admin</option>
            </select>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Full Name
            </label>
            <input
              name="name"
              placeholder="Enter your full name"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Password
            </label>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 focus:outline-none text-sm sm:text-base"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Phone Number
            </label>
            <input
              name="phone"
              placeholder="Enter your phone number"
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Location
            </label>
            <input
              name="location"
              placeholder="Enter your location"
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Company Field (Visible for Providers Only) */}
          {role === 'provider' && (
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
                Company Name
              </label>
              <input
                name="company"
                placeholder="Enter your company name"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold text-base sm:text-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-300 shadow-md"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
