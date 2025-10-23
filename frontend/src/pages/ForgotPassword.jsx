import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        email,
        role,
        newPassword
      });
      setMessage(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-reset-otp`, {
        email,
        role,
        otp
      });
      setMessage(response.data.message);
      setStep(3);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying OTP');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-6 text-center">Forgot Password</h2>

        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="user">User</option>
                <option value="provider">Service Provider</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-500 text-white py-3 rounded font-semibold hover:bg-yellow-600 transition"
            >
              Send OTP
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full mt-2 text-center text-yellow-600 hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter the OTP sent to your email"
                className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-500 text-white py-3 rounded font-semibold hover:bg-yellow-600 transition"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-2 text-center text-yellow-600 hover:underline"
            >
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center text-green-700 font-semibold">
            Password reset successful! Redirecting to login...
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
