import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const role = searchParams.get('role');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !role || !email) {
      setError('Invalid reset link');
    }
  }, [token, role, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setMessage('');
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        role,
        email,
        newPassword
      });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">Reset Password</h2>
        
        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm sm:text-base text-center">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold text-base sm:text-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-md"
          >
            Reset Password
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-3 text-center text-green-600 hover:text-green-700 font-semibold hover:underline text-sm sm:text-base"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
