import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOTP } from '../api/auth';

export default function VerifyOtp() {
  const [formData, setFormData] = useState({ role: '', id: '', otp: '' });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse query params to get role and id
    const params = new URLSearchParams(location.search);
    const role = params.get('role') || '';
    const id = params.get('id') || '';
    setFormData((prev) => ({ ...prev, role, id }));
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await verifyOTP(formData);
      toast.success(response.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">Enter the OTP sent to your email</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
            <input
              name="id"
              value={formData.id}
              placeholder="User ID"
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
            <input
              name="otp"
              value={formData.otp}
              placeholder="Enter 6-digit OTP"
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
              maxLength="6"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Verify OTP
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Didn't receive the code? <button className="text-purple-600 hover:underline font-medium">Resend OTP</button>
          </p>
        </div>
      </div>
    </div>
  );
}
